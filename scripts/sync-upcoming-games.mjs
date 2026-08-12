import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cataloguePath = path.join(root, "assets", "recent-games.js");
const registryPath = path.join(root, "assets", "upcoming-games.json");
const shouldWrite = process.argv.includes("--write");
const requestTimeoutMs = 8000;

function extractCatalogue(source) {
  const match = source.match(/^\s*window\.LAUNCHER_RECENT_GAMES\s*=\s*(\[[\s\S]*\]);\s*$/);
  if (!match) throw new Error("Le catalogue recent-games.js ne respecte pas le format attendu.");
  const parsed = JSON.parse(match[1]);
  if (!Array.isArray(parsed)) throw new Error("Le catalogue récent doit être un tableau.");
  return parsed;
}

function serializeCatalogue(apps) {
  return "window.LAUNCHER_RECENT_GAMES = " + JSON.stringify(apps, null, 2) + ";\n";
}

async function requestJson(url, token, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        "User-Agent": "launcher-catalogue-sync",
        ...headers
      },
      signal: controller.signal
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("HTTP " + response.status + " pour " + url);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyPublicUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "launcher-catalogue-sync" },
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") || "";
    return response.status >= 200
      && response.status < 400
      && contentType.toLowerCase().includes("text/html");
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function findRepository(entry, owner, githubToken) {
  for (const repositoryName of entry.githubRepos) {
    const repository = await requestJson(
      "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repositoryName),
      githubToken,
      { "X-GitHub-Api-Version": "2022-11-28" }
    );
    if (!repository) continue;
    if (
      String(repository.owner?.login || "").toLowerCase() !== owner.toLowerCase()
      || repository.archived
      || repository.disabled
      || !repository.default_branch
    ) {
      continue;
    }
    const head = await requestJson(
      "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repositoryName)
        + "/commits/" + encodeURIComponent(repository.default_branch),
      githubToken,
      { "X-GitHub-Api-Version": "2022-11-28" }
    );
    if (head?.sha) return repository;
  }
  return null;
}

async function findDeployment(entry, repository, owner, vercelToken, teamId) {
  for (const projectName of entry.vercelProjects) {
    const projectUrl = "https://api.vercel.com/v9/projects/" + encodeURIComponent(projectName)
      + "?teamId=" + encodeURIComponent(teamId);
    const project = await requestJson(projectUrl, vercelToken);
    if (!project) continue;
    const link = project.link || {};
    if (
      link.type !== "github"
      || String(link.org || "").toLowerCase() !== owner.toLowerCase()
      || String(link.repo || "").toLowerCase() !== String(repository.name || "").toLowerCase()
      || Number(link.repoId) !== Number(repository.id)
    ) {
      continue;
    }

    const deploymentsUrl = "https://api.vercel.com/v6/deployments?projectId="
      + encodeURIComponent(project.id)
      + "&target=production&state=READY&limit=10&teamId="
      + encodeURIComponent(teamId);
    const deploymentResponse = await requestJson(deploymentsUrl, vercelToken);
    const deployments = Array.isArray(deploymentResponse?.deployments)
      ? deploymentResponse.deployments
      : [];
    const deployment = deployments.find((item) => (
      item?.readyState === "READY"
      && item?.target === "production"
      && item.readySubstate === "PROMOTED"
      && item.aliasAssigned === true
    ));
    if (!deployment) continue;

    const deploymentAliases = new Set(
      (Array.isArray(deployment.alias) ? deployment.alias : [])
        .map((alias) => String(alias || "").toLowerCase())
        .filter(Boolean)
    );
    const allowedHosts = new Set(
      (Array.isArray(entry.publicCandidates) ? entry.publicCandidates : [])
        .map((candidate) => {
          try { return new URL(candidate).hostname.toLowerCase(); } catch { return ""; }
        })
        .filter(Boolean)
    );
    const canonicalHost = [...deploymentAliases].find((alias) => (
      allowedHosts.has(alias)
      && alias.endsWith(".vercel.app")
      && !alias.includes("-git-")
    ));
    if (!canonicalHost) continue;
    const publicUrl = "https://" + canonicalHost;
    if (await verifyPublicUrl(publicUrl)) {
      return { publicUrl, projectId: project.id, deploymentId: deployment.uid || deployment.id };
    }
  }
  return null;
}

function structuralChanges(before, after) {
  const beforeById = new Map(before.map((app) => [app.id, app]));
  const allowed = new Set(["link", "status", "releaseState"]);
  const violations = [];
  for (const nextApp of after) {
    const previousApp = beforeById.get(nextApp.id);
    if (!previousApp) {
      violations.push(nextApp.id + ": entrée ajoutée");
      continue;
    }
    const keys = new Set([...Object.keys(previousApp), ...Object.keys(nextApp)]);
    for (const key of keys) {
      if (JSON.stringify(previousApp[key]) !== JSON.stringify(nextApp[key]) && !allowed.has(key)) {
        violations.push(nextApp.id + "." + key);
      }
    }
  }
  if (before.length !== after.length) violations.push("nombre d'entrées");
  return violations;
}

async function main() {
  const [catalogueSource, registrySource] = await Promise.all([
    readFile(cataloguePath, "utf8"),
    readFile(registryPath, "utf8")
  ]);
  const registry = JSON.parse(registrySource);
  const catalogue = extractCatalogue(catalogueSource);
  const before = structuredClone(catalogue);
  const catalogueById = new Map(catalogue.map((app) => [app.id, app]));

  const githubToken = process.env.CATALOG_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
  const vercelToken = process.env.VERCEL_TOKEN || "";
  const owner = process.env.CATALOG_GITHUB_OWNER || registry.owner;
  const teamId = process.env.VERCEL_TEAM_ID || registry.teamId;

  if (!githubToken || !vercelToken || !owner || !teamId) {
    console.log("Synchronisation ignorée: configurez les jetons GitHub/Vercel et les identifiants du catalogue.");
    return;
  }

  const promotions = [];
  for (const entry of registry.games) {
    const app = catalogueById.get(entry.id);
    if (!app) throw new Error("Jeu suivi absent du catalogue: " + entry.id);
    if (app.link && app.releaseState === "published") continue;
    if (app.link || app.status !== "En préparation de publication") {
      throw new Error("État ambigu pour " + entry.id + "; synchronisation interrompue.");
    }

    const repository = await findRepository(entry, owner, githubToken);
    if (!repository) {
      console.log(entry.id + ": dépôt GitHub vérifié introuvable.");
      continue;
    }
    const deployment = await findDeployment(entry, repository, owner, vercelToken, teamId);
    if (!deployment) {
      console.log(entry.id + ": aucune production Vercel READY/PROMOTED concordante.");
      continue;
    }

    app.link = deployment.publicUrl;
    app.status = "Vercel";
    app.releaseState = "published";
    promotions.push({
      id: entry.id,
      repository: repository.full_name,
      repositoryId: repository.id,
      projectId: deployment.projectId,
      deploymentId: deployment.deploymentId,
      url: deployment.publicUrl
    });
  }

  const violations = structuralChanges(before, catalogue);
  if (violations.length) {
    throw new Error("Modifications non autorisées: " + violations.join(", "));
  }
  if (!promotions.length) {
    console.log("Aucune nouvelle publication vérifiée.");
    return;
  }

  for (const promotion of promotions) {
    console.log(
      promotion.id + ": " + promotion.repository + " (" + promotion.repositoryId + ") -> "
      + promotion.projectId + " / " + promotion.deploymentId + " -> " + promotion.url
    );
  }

  if (shouldWrite) {
    await writeFile(cataloguePath, serializeCatalogue(catalogue), "utf8");
    const reparsed = extractCatalogue(await readFile(cataloguePath, "utf8"));
    if (JSON.stringify(reparsed) !== JSON.stringify(catalogue)) {
      throw new Error("La relecture du catalogue synchronisé a échoué.");
    }
    console.log(promotions.length + " publication(s) écrite(s) dans assets/recent-games.js.");
  } else {
    console.log("Mode simulation: utilisez --write pour appliquer les promotions vérifiées.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
