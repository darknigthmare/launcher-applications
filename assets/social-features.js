(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;

  const SUPABASE_URL = "https://hykklcvvwjwhcvukbzts.supabase.co";
  const SUPABASE_KEY = "sb_publishable_hAcM5bQMkl9a0wn7tgzupg_DeSgYQZC";
  const VISITOR_STORAGE_KEY = "launcher-social-visitor:v1";
  const CACHE_STORAGE_KEY = "launcher-social-cache:v2";
  const ADMIN_SESSION_KEY = "launcher-social-admin-session:v1";
  const REQUEST_TIMEOUT_MS = 12000;
  const REFRESH_INTERVAL_MS = 30000;
  const MAX_VISITS = Number.MAX_SAFE_INTEGER;
  const MAX_COMMENTS_PER_APP = 100;
  const MAX_AUTHOR_LENGTH = 40;
  const MAX_COMMENT_LENGTH = 800;
  const MAX_APP_ID_LENGTH = 128;

  const mountedPanels = new Set();
  const controllersByContainer = new WeakMap();

  let panelSequence = 0;
  let storageUsable = true;
  let storageIssue = "";
  let memoryVisitorId = "";
  let adminSessionLoaded = false;
  let adminSession = null;
  let adminResolutionPromise = null;

  class RequestError extends Error {
    constructor(message, status, code) {
      super(message);
      this.name = "RequestError";
      this.status = status;
      this.code = code || "";
    }
  }

  function safeStorageGet(key) {
    if (!storageUsable) return null;

    try {
      return window.localStorage.getItem(key);
    } catch {
      storageUsable = false;
      storageIssue =
        "Ce navigateur ne peut pas mémoriser votre identité de visiteur.";
      return null;
    }
  }

  function safeStorageSet(key, value) {
    if (!storageUsable) return false;

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      storageUsable = false;
      storageIssue =
        "Ce navigateur ne peut pas mémoriser votre identité de visiteur.";
      return false;
    }
  }

  function safeStorageRemove(key) {
    if (!storageUsable) return;

    try {
      window.localStorage.removeItem(key);
    } catch {
      storageUsable = false;
      storageIssue =
        "Ce navigateur ne peut pas mémoriser votre identité de visiteur.";
    }
  }

  function readStoredJson(key, fallback) {
    const value = safeStorageGet(key);
    if (!value) return fallback;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function normalizeAppId(value) {
    const appId = String(value ?? "").trim();

    if (
      !appId ||
      appId.length > MAX_APP_ID_LENGTH ||
      !/^[a-z0-9][a-z0-9._:-]*$/i.test(appId)
    ) {
      throw new TypeError(
        "appId doit contenir de 1 à 128 caractères alphanumériques, tirets, points, deux-points ou underscores."
      );
    }

    return appId;
  }

  function clampNumber(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function clampInteger(value, minimum, maximum) {
    return Math.trunc(clampNumber(value, minimum, maximum));
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || "")
    );
  }

  function createUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20)
    ].join("-");
  }

  function getVisitorId() {
    if (isUuid(memoryVisitorId)) return memoryVisitorId;

    const storedId = safeStorageGet(VISITOR_STORAGE_KEY);
    if (isUuid(storedId)) {
      memoryVisitorId = storedId;
      return memoryVisitorId;
    }

    memoryVisitorId = createUuid();
    safeStorageSet(VISITOR_STORAGE_KEY, memoryVisitorId);
    return memoryVisitorId;
  }

  function emptySnapshot(appId) {
    return {
      appId,
      visits: 0,
      ratingAverage: 0,
      ratingCount: 0,
      viewerRating: null,
      comments: []
    };
  }

  function sanitizeComment(rawComment) {
    if (!rawComment || typeof rawComment !== "object") return null;

    const id = String(rawComment.id || "");
    const text = String(rawComment.text ?? "")
      .trim()
      .slice(0, MAX_COMMENT_LENGTH);
    const author = String(rawComment.author ?? "")
      .trim()
      .slice(0, MAX_AUTHOR_LENGTH);
    const parsedDate = new Date(rawComment.createdAt);

    if (!isUuid(id) || !text || Number.isNaN(parsedDate.getTime())) return null;

    return {
      id,
      author,
      text,
      createdAt: parsedDate.toISOString()
    };
  }

  function sanitizeSnapshot(rawSnapshot, appId) {
    const source =
      rawSnapshot && typeof rawSnapshot === "object" ? rawSnapshot : {};
    const viewerRating = Number(source.viewerRating);
    const comments = Array.isArray(source.comments)
      ? source.comments
          .map(sanitizeComment)
          .filter(Boolean)
          .slice(0, MAX_COMMENTS_PER_APP)
      : [];

    return {
      appId,
      visits: clampInteger(source.visits, 0, MAX_VISITS),
      ratingAverage: clampNumber(source.ratingAverage, 0, 5),
      ratingCount: clampInteger(source.ratingCount, 0, MAX_VISITS),
      viewerRating:
        Number.isInteger(viewerRating) &&
        viewerRating >= 1 &&
        viewerRating <= 5
          ? viewerRating
          : null,
      comments
    };
  }

  function loadCache() {
    const stored = readStoredJson(CACHE_STORAGE_KEY, null);
    const apps = Object.create(null);

    if (stored && typeof stored === "object" && stored.apps) {
      Object.keys(stored.apps).forEach((rawAppId) => {
        try {
          const appId = normalizeAppId(rawAppId);
          apps[appId] = sanitizeSnapshot(stored.apps[rawAppId], appId);
        } catch {
          // Ignore malformed cache entries without losing valid applications.
        }
      });
    }

    return { version: 2, apps };
  }

  let cacheState = loadCache();

  function getCachedSnapshot(appId) {
    return cacheState.apps[appId] || emptySnapshot(appId);
  }

  function cacheSnapshot(snapshot) {
    cacheState.apps[snapshot.appId] = sanitizeSnapshot(
      snapshot,
      snapshot.appId
    );
    safeStorageSet(CACHE_STORAGE_KEY, JSON.stringify(cacheState));
    return cacheState.apps[snapshot.appId];
  }

  async function request(path, options) {
    const config = options || {};
    const token = config.token || SUPABASE_KEY;
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      ...(config.headers || {})
    };

    if (config.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const abortController =
      typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = abortController
      ? window.setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS)
      : null;

    let response;
    try {
      response = await window.fetch(`${SUPABASE_URL}${path}`, {
        method: config.method || "POST",
        headers,
        body:
          config.body === undefined ? undefined : JSON.stringify(config.body),
        signal: abortController ? abortController.signal : undefined
      });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new RequestError("Le serveur met trop de temps à répondre.", 0);
      }
      throw new RequestError("Connexion aux données partagées impossible.", 0);
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    }

    const rawText = await response.text();
    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    }

    if (!response.ok) {
      const message =
        data && typeof data === "object"
          ? data.error_description || data.message
          : "";
      throw new RequestError(
        message || `Erreur du serveur (${response.status}).`,
        response.status,
        data && typeof data === "object" ? data.code : ""
      );
    }

    return data;
  }

  function rpc(functionName, body, token) {
    return request(`/rest/v1/rpc/${functionName}`, {
      body,
      token
    });
  }

  async function loadSharedSnapshot(appId) {
    const visitorId = getVisitorId();
    const rawSnapshot = await rpc("launcher_social_snapshot", {
      p_app_id: appId,
      p_visitor_id: visitorId
    });
    return cacheSnapshot(sanitizeSnapshot(rawSnapshot, appId));
  }

  function notifyPanels(appId, snapshot) {
    mountedPanels.forEach((mountedPanel) => {
      if (mountedPanel.appId === appId) {
        mountedPanel.render(snapshot);
      }
    });
  }

  async function recordVisit(appId) {
    const normalizedId = normalizeAppId(appId);

    try {
      const count = clampInteger(
        await rpc("launcher_record_visit", { p_app_id: normalizedId }),
        0,
        MAX_VISITS
      );
      const snapshot = cacheSnapshot({
        ...getCachedSnapshot(normalizedId),
        visits: count
      });
      notifyPanels(normalizedId, snapshot);
      return count;
    } catch {
      return getCachedSnapshot(normalizedId).visits;
    }
  }

  async function getVisitCount(appId) {
    const normalizedId = normalizeAppId(appId);

    try {
      return (await loadSharedSnapshot(normalizedId)).visits;
    } catch {
      return getCachedSnapshot(normalizedId).visits;
    }
  }

  function normalizeAdminSession(rawSession) {
    const source =
      rawSession && rawSession.session ? rawSession.session : rawSession;

    if (
      !source ||
      !source.access_token ||
      !source.refresh_token ||
      !source.user
    ) {
      return null;
    }

    const expiresAt = Number(source.expires_at);
    const expiresIn = Number(source.expires_in);

    return {
      access_token: String(source.access_token),
      refresh_token: String(source.refresh_token),
      expires_at: Number.isFinite(expiresAt)
        ? expiresAt
        : Math.floor(Date.now() / 1000) +
          (Number.isFinite(expiresIn) ? expiresIn : 3600),
      user: {
        id: String(source.user.id || ""),
        email: String(source.user.email || "")
      }
    };
  }

  function readAdminSession() {
    if (!adminSessionLoaded) {
      adminSession = normalizeAdminSession(
        readStoredJson(ADMIN_SESSION_KEY, null)
      );
      adminSessionLoaded = true;
    }
    return adminSession;
  }

  function storeAdminSession(session) {
    adminSession = normalizeAdminSession(session);
    adminSessionLoaded = true;
    adminResolutionPromise = null;

    if (adminSession) {
      safeStorageSet(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
    } else {
      safeStorageRemove(ADMIN_SESSION_KEY);
    }

    return adminSession;
  }

  async function refreshAdminSession(session) {
    const refreshed = await request("/auth/v1/token?grant_type=refresh_token", {
      body: { refresh_token: session.refresh_token }
    });
    return storeAdminSession(refreshed);
  }

  async function getValidAdminSession() {
    let session = readAdminSession();
    if (!session) return null;

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at > now + 90) return session;

    try {
      session = await refreshAdminSession(session);
      return session;
    } catch {
      storeAdminSession(null);
      return null;
    }
  }

  async function resolveAdminSession(force) {
    if (!force && adminResolutionPromise) return adminResolutionPromise;

    adminResolutionPromise = (async () => {
      const session = await getValidAdminSession();
      if (!session) {
        return { authenticated: false, token: "", email: "" };
      }

      try {
        const isAdmin = Boolean(
          await rpc("launcher_is_admin", {}, session.access_token)
        );

        if (!isAdmin) {
          return {
            authenticated: false,
            token: "",
            email: session.user.email,
            unauthorized: true
          };
        }

        return {
          authenticated: true,
          token: session.access_token,
          email: session.user.email
        };
      } catch {
        return { authenticated: false, token: "", email: "" };
      }
    })();

    return adminResolutionPromise;
  }

  async function signInAdmin(email, password) {
    const response = await request("/auth/v1/token?grant_type=password", {
      body: { email, password }
    });
    const session = storeAdminSession(response);
    const resolved = await resolveAdminSession(true);

    if (!session || !resolved.authenticated) {
      storeAdminSession(null);
      throw new RequestError("Ce compte n’est pas administrateur.", 403);
    }

    return resolved;
  }

  async function signOutAdmin() {
    const session = readAdminSession();
    storeAdminSession(null);

    if (!session || !session.access_token) return;

    try {
      await request("/auth/v1/logout", {
        body: {},
        token: session.access_token
      });
    } catch {
      // The local session is removed even if remote revocation is unavailable.
    }
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setStatus(element, message, kind) {
    element.textContent = message;
    element.dataset.kind = kind || "";
  }

  function formatDate(isoDate) {
    const date = new Date(isoDate);

    try {
      return new Intl.DateTimeFormat(
        document.documentElement.lang || navigator.language || "fr-FR",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      ).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  function formatRating(value) {
    try {
      return new Intl.NumberFormat(
        document.documentElement.lang || navigator.language || "fr-FR",
        { minimumFractionDigits: 0, maximumFractionDigits: 1 }
      ).format(value);
    } catch {
      return String(Math.round(value * 10) / 10);
    }
  }

  function mountPanel(container, app, options) {
    if (!container || typeof container.replaceChildren !== "function") {
      throw new TypeError("container doit être un élément DOM valide.");
    }

    if (!app || typeof app !== "object") {
      throw new TypeError("app doit être un objet contenant au minimum un id.");
    }

    const appId = normalizeAppId(app.id);
    const appName = String(app.name || appId).trim().slice(0, 120);
    const adminMode = Boolean(options && options.adminMode);
    const previousController = controllersByContainer.get(container);

    if (previousController) previousController.destroy();

    panelSequence += 1;
    const instanceId = `launcher-social-${panelSequence}`;
    const ratingLabelId = `${instanceId}-rating-label`;
    const authorInputId = `${instanceId}-author`;
    const commentInputId = `${instanceId}-comment`;
    const adminEmailId = `${instanceId}-admin-email`;
    const adminPasswordId = `${instanceId}-admin-password`;

    const panel = createElement("section", "launcher-social");
    panel.dataset.appId = appId;
    panel.setAttribute("aria-label", `Activité de ${appName}`);

    const header = createElement("header", "launcher-social__header");
    const titleGroup = createElement("div", "launcher-social__title-group");
    const eyebrow = createElement("p", "launcher-social__eyebrow", "Activité");
    const title = createElement("h3", "launcher-social__title", appName);
    titleGroup.append(eyebrow, title);

    const visitCounter = createElement("div", "launcher-social__visits");
    visitCounter.setAttribute("aria-live", "polite");
    const visitValue = createElement("strong", "launcher-social__visit-value", "0");
    const visitLabel = createElement(
      "span",
      "launcher-social__visit-label",
      "ouvertures"
    );
    visitCounter.append(visitValue, visitLabel);
    header.append(titleGroup, visitCounter);

    const ratingSection = createElement("section", "launcher-social__section");
    const ratingTitle = createElement(
      "h4",
      "launcher-social__section-title",
      "Notes"
    );
    ratingTitle.id = ratingLabelId;

    const ratingRow = createElement("div", "launcher-social__rating-row");
    const ratingGroup = createElement("div", "launcher-social__stars");
    ratingGroup.setAttribute("role", "radiogroup");
    ratingGroup.setAttribute("aria-labelledby", ratingLabelId);

    const starButtons = [];
    for (let value = 1; value <= 5; value += 1) {
      const star = createElement("button", "launcher-social__star", "★");
      star.type = "button";
      star.dataset.value = String(value);
      star.setAttribute("role", "radio");
      star.setAttribute("aria-checked", "false");
      star.setAttribute(
        "aria-label",
        `${value} étoile${value > 1 ? "s" : ""} sur 5`
      );
      star.tabIndex = value === 1 ? 0 : -1;
      starButtons.push(star);
      ratingGroup.append(star);
    }

    const ratingSummary = createElement(
      "output",
      "launcher-social__rating-summary",
      "Aucune note"
    );
    ratingSummary.setAttribute("aria-live", "polite");
    ratingRow.append(ratingGroup, ratingSummary);

    const ratingStatus = createElement("p", "launcher-social__status");
    ratingStatus.setAttribute("role", "status");
    ratingStatus.setAttribute("aria-live", "polite");
    ratingSection.append(ratingTitle, ratingRow, ratingStatus);

    const commentsSection = createElement("section", "launcher-social__section");
    const commentsHeading = createElement(
      "div",
      "launcher-social__comments-heading"
    );
    const commentsTitle = createElement(
      "h4",
      "launcher-social__section-title",
      "Commentaires"
    );
    const commentsCount = createElement(
      "span",
      "launcher-social__comments-count",
      "0"
    );
    commentsCount.setAttribute("aria-label", "0 commentaire");
    commentsHeading.append(commentsTitle, commentsCount);

    const form = createElement("form", "launcher-social__form");
    form.noValidate = true;

    const authorField = createElement("div", "launcher-social__field");
    const authorLabel = createElement(
      "label",
      "launcher-social__label",
      "Pseudo (facultatif)"
    );
    authorLabel.htmlFor = authorInputId;
    const authorInput = createElement("input", "launcher-social__input");
    authorInput.id = authorInputId;
    authorInput.name = "author";
    authorInput.type = "text";
    authorInput.maxLength = MAX_AUTHOR_LENGTH;
    authorInput.autocomplete = "nickname";
    authorField.append(authorLabel, authorInput);

    const commentField = createElement("div", "launcher-social__field");
    const commentLabel = createElement(
      "label",
      "launcher-social__label",
      "Commentaire"
    );
    commentLabel.htmlFor = commentInputId;
    const commentInput = createElement("textarea", "launcher-social__textarea");
    commentInput.id = commentInputId;
    commentInput.name = "comment";
    commentInput.required = true;
    commentInput.maxLength = MAX_COMMENT_LENGTH;
    commentInput.rows = 4;
    commentField.append(commentLabel, commentInput);

    const formFooter = createElement("div", "launcher-social__form-footer");
    const characterCount = createElement(
      "span",
      "launcher-social__character-count",
      `0/${MAX_COMMENT_LENGTH}`
    );
    const submitButton = createElement(
      "button",
      "launcher-social__submit",
      "Publier"
    );
    submitButton.type = "submit";
    formFooter.append(characterCount, submitButton);

    const formStatus = createElement("p", "launcher-social__status");
    formStatus.setAttribute("role", "status");
    formStatus.setAttribute("aria-live", "polite");
    form.append(authorField, commentField, formFooter, formStatus);

    const syncNotice = createElement("p", "launcher-social__storage-notice");
    syncNotice.setAttribute("role", "status");
    syncNotice.hidden = true;

    const storageNotice = createElement("p", "launcher-social__storage-notice");
    storageNotice.setAttribute("role", "status");
    storageNotice.hidden = !storageIssue;
    storageNotice.textContent = storageIssue;

    let adminSection = null;
    let adminLoginForm = null;
    let adminActiveBar = null;
    let adminEmailInput = null;
    let adminPasswordInput = null;
    let adminStatus = null;
    let adminIdentity = null;
    let adminLoginButton = null;
    let adminLogoutButton = null;

    if (adminMode) {
      adminSection = createElement("section", "launcher-social__admin");
      const adminHeader = createElement("div", "launcher-social__admin-header");
      const adminTitle = createElement(
        "h4",
        "launcher-social__admin-title",
        "Administration"
      );
      adminHeader.append(adminTitle);

      adminLoginForm = createElement("form", "launcher-social__admin-form");
      adminLoginForm.noValidate = true;

      const adminEmailField = createElement("div", "launcher-social__field");
      const adminEmailLabel = createElement(
        "label",
        "launcher-social__label",
        "E-mail"
      );
      adminEmailLabel.htmlFor = adminEmailId;
      adminEmailInput = createElement("input", "launcher-social__input");
      adminEmailInput.id = adminEmailId;
      adminEmailInput.type = "email";
      adminEmailInput.required = true;
      adminEmailInput.autocomplete = "username";
      adminEmailField.append(adminEmailLabel, adminEmailInput);

      const adminPasswordField = createElement("div", "launcher-social__field");
      const adminPasswordLabel = createElement(
        "label",
        "launcher-social__label",
        "Mot de passe"
      );
      adminPasswordLabel.htmlFor = adminPasswordId;
      adminPasswordInput = createElement("input", "launcher-social__input");
      adminPasswordInput.id = adminPasswordId;
      adminPasswordInput.type = "password";
      adminPasswordInput.required = true;
      adminPasswordInput.autocomplete = "current-password";
      adminPasswordField.append(adminPasswordLabel, adminPasswordInput);

      adminLoginButton = createElement(
        "button",
        "launcher-social__admin-button",
        "Connexion"
      );
      adminLoginButton.type = "submit";
      adminLoginForm.append(
        adminEmailField,
        adminPasswordField,
        adminLoginButton
      );

      adminActiveBar = createElement(
        "div",
        "launcher-social__admin-active"
      );
      adminActiveBar.hidden = true;
      adminIdentity = createElement(
        "span",
        "launcher-social__admin-identity",
        "Administration active"
      );
      adminLogoutButton = createElement(
        "button",
        "launcher-social__admin-button launcher-social__admin-button--quiet",
        "Déconnexion"
      );
      adminLogoutButton.type = "button";
      adminActiveBar.append(adminIdentity, adminLogoutButton);

      adminStatus = createElement("p", "launcher-social__status");
      adminStatus.setAttribute("role", "status");
      adminStatus.setAttribute("aria-live", "polite");

      adminSection.append(
        adminHeader,
        adminLoginForm,
        adminActiveBar,
        adminStatus
      );
    }

    const emptyState = createElement(
      "p",
      "launcher-social__empty",
      "Aucun commentaire."
    );
    const commentList = createElement("ol", "launcher-social__comment-list");

    commentsSection.append(
      commentsHeading,
      form,
      syncNotice,
      storageNotice
    );
    if (adminSection) commentsSection.append(adminSection);
    commentsSection.append(emptyState, commentList);
    panel.append(header, ratingSection, commentsSection);

    let destroyed = false;
    let ratingBusy = false;
    let currentSnapshot = getCachedSnapshot(appId);
    let adminAuthenticated = false;
    let adminToken = "";
    let adminEmail = "";
    let refreshSequence = 0;
    let pollTimer = null;
    let readyPromise = Promise.resolve();
    let publicController = null;

    function setPanelBusy(busy) {
      panel.classList.toggle("is-busy", busy);
      panel.setAttribute("aria-busy", String(busy));
      submitButton.disabled = busy;
    }

    function renderRating(snapshot) {
      const personalRating = snapshot.viewerRating;

      starButtons.forEach((star, index) => {
        const value = index + 1;
        const selected = value === personalRating;
        star.classList.toggle(
          "is-active",
          personalRating !== null && value <= personalRating
        );
        star.setAttribute("aria-checked", String(selected));
        star.tabIndex =
          (personalRating === null && value === 1) || selected ? 0 : -1;
        star.disabled = ratingBusy;
      });

      if (snapshot.ratingCount === 0) {
        ratingSummary.textContent = "Aucune note";
      } else {
        ratingSummary.textContent = `${formatRating(
          snapshot.ratingAverage
        )}/5 · ${snapshot.ratingCount} note${
          snapshot.ratingCount > 1 ? "s" : ""
        }`;
      }
    }

    function renderAdminState() {
      if (!adminMode) return;

      adminLoginForm.hidden = adminAuthenticated;
      adminActiveBar.hidden = !adminAuthenticated;
      adminIdentity.textContent = adminAuthenticated
        ? adminEmail || "Administration active"
        : "";
    }

    function renderComments(comments) {
      commentList.replaceChildren();
      emptyState.hidden = comments.length > 0;
      commentsCount.textContent = String(comments.length);
      commentsCount.setAttribute(
        "aria-label",
        `${comments.length} commentaire${comments.length > 1 ? "s" : ""}`
      );

      comments.forEach((comment) => {
        const item = createElement("li", "launcher-social__comment");
        const commentHeader = createElement(
          "div",
          "launcher-social__comment-header"
        );
        const identity = createElement(
          "strong",
          "launcher-social__comment-author",
          comment.author || "Anonyme"
        );
        const date = createElement(
          "time",
          "launcher-social__comment-date",
          formatDate(comment.createdAt)
        );
        date.dateTime = comment.createdAt;
        commentHeader.append(identity, date);

        if (adminMode && adminAuthenticated) {
          const deleteButton = createElement(
            "button",
            "launcher-social__delete",
            "Supprimer"
          );
          deleteButton.type = "button";
          deleteButton.setAttribute(
            "aria-label",
            `Supprimer le commentaire de ${comment.author || "Anonyme"}`
          );
          deleteButton.addEventListener("click", async () => {
            const confirmed =
              typeof window.confirm !== "function" ||
              window.confirm("Supprimer ce commentaire ?");
            if (!confirmed) return;

            deleteButton.disabled = true;
            setStatus(formStatus, "Suppression…", "");

            try {
              const resolved = await resolveAdminSession(true);
              if (!resolved.authenticated) {
                throw new RequestError("Session administrateur expirée.", 401);
              }

              adminToken = resolved.token;
              const rawSnapshot = await rpc(
                "launcher_delete_comment",
                {
                  p_comment_id: comment.id,
                  p_visitor_id: getVisitorId()
                },
                adminToken
              );
              const snapshot = cacheSnapshot(
                sanitizeSnapshot(rawSnapshot, appId)
              );
              notifyPanels(appId, snapshot);
              setStatus(formStatus, "Commentaire supprimé.", "success");
            } catch (error) {
              if (error instanceof RequestError && [401, 403].includes(error.status)) {
                storeAdminSession(null);
                adminAuthenticated = false;
                adminToken = "";
                renderAdminState();
                renderComments(currentSnapshot.comments);
              }
              setStatus(
                formStatus,
                error instanceof Error
                  ? error.message
                  : "Suppression impossible.",
                "error"
              );
            } finally {
              deleteButton.disabled = false;
            }
          });
          commentHeader.append(deleteButton);
        }

        const body = createElement(
          "p",
          "launcher-social__comment-text",
          comment.text
        );
        item.append(commentHeader, body);
        commentList.append(item);
      });
    }

    function render(snapshot) {
      if (destroyed) return;

      currentSnapshot = sanitizeSnapshot(snapshot, appId);
      visitValue.textContent = String(currentSnapshot.visits);
      visitLabel.textContent =
        currentSnapshot.visits === 1 ? "ouverture" : "ouvertures";
      visitCounter.setAttribute(
        "aria-label",
        `${currentSnapshot.visits} ouverture${
          currentSnapshot.visits > 1 ? "s" : ""
        }`
      );
      renderRating(currentSnapshot);
      renderAdminState();
      renderComments(currentSnapshot.comments);
      storageNotice.hidden = !storageIssue;
      storageNotice.textContent = storageIssue;
    }

    async function refreshSnapshot(quiet) {
      const sequence = ++refreshSequence;
      if (!quiet) setPanelBusy(true);

      try {
        const snapshot = await loadSharedSnapshot(appId);
        if (destroyed || sequence !== refreshSequence) return snapshot;

        syncNotice.hidden = true;
        syncNotice.textContent = "";
        notifyPanels(appId, snapshot);
        return snapshot;
      } catch (error) {
        if (!destroyed && sequence === refreshSequence) {
          syncNotice.hidden = false;
          syncNotice.textContent =
            error instanceof Error
              ? error.message
              : "Connexion aux données partagées impossible.";
          render(getCachedSnapshot(appId));
        }
        return getCachedSnapshot(appId);
      } finally {
        if (!quiet && !destroyed && sequence === refreshSequence) {
          setPanelBusy(false);
        }
      }
    }

    async function refreshAdminState() {
      if (!adminMode || destroyed) return;

      const resolved = await resolveAdminSession(false);
      if (destroyed) return;

      adminAuthenticated = resolved.authenticated;
      adminToken = resolved.token;
      adminEmail = resolved.email;
      renderAdminState();
      renderComments(currentSnapshot.comments);

      if (resolved.unauthorized) {
        setStatus(adminStatus, "Ce compte n’est pas administrateur.", "error");
      }
    }

    async function refresh() {
      const operations = [refreshSnapshot(false)];
      if (adminMode) operations.push(refreshAdminState());
      await Promise.allSettled(operations);
      return currentSnapshot;
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      refreshSequence += 1;
      if (pollTimer !== null) window.clearInterval(pollTimer);
      mountedPanels.delete(mountedPanel);
      if (controllersByContainer.get(container) === publicController) {
        controllersByContainer.delete(container);
      }
      panel.remove();
    }

    const mountedPanel = {
      appId,
      render
    };

    starButtons.forEach((star, index) => {
      star.addEventListener("click", async () => {
        if (ratingBusy) return;

        ratingBusy = true;
        setStatus(ratingStatus, "Enregistrement…", "");
        renderRating(currentSnapshot);

        try {
          const rawSnapshot = await rpc("launcher_set_rating", {
            p_app_id: appId,
            p_visitor_id: getVisitorId(),
            p_rating: index + 1
          });
          const snapshot = cacheSnapshot(
            sanitizeSnapshot(rawSnapshot, appId)
          );
          notifyPanels(appId, snapshot);
          setStatus(ratingStatus, "Note enregistrée.", "success");
        } catch (error) {
          setStatus(
            ratingStatus,
            error instanceof Error ? error.message : "Notation impossible.",
            "error"
          );
        } finally {
          ratingBusy = false;
          renderRating(currentSnapshot);
        }
      });

      star.addEventListener("keydown", (event) => {
        let targetIndex = null;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          targetIndex = (index + 1) % starButtons.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          targetIndex = (index - 1 + starButtons.length) % starButtons.length;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = starButtons.length - 1;
        }

        if (targetIndex === null) return;

        event.preventDefault();
        starButtons[targetIndex].focus();
        starButtons[targetIndex].click();
      });
    });

    commentInput.addEventListener("input", () => {
      characterCount.textContent = `${commentInput.value.length}/${MAX_COMMENT_LENGTH}`;
      if (commentInput.value.trim()) {
        commentInput.removeAttribute("aria-invalid");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(formStatus, "", "");

      const author = authorInput.value.trim();
      const comment = commentInput.value.trim();

      if (!comment) {
        commentInput.setAttribute("aria-invalid", "true");
        setStatus(formStatus, "Le commentaire est obligatoire.", "error");
        commentInput.focus();
        return;
      }

      submitButton.disabled = true;
      setStatus(formStatus, "Publication…", "");

      try {
        const rawSnapshot = await rpc("launcher_add_comment", {
          p_app_id: appId,
          p_visitor_id: getVisitorId(),
          p_author: author || null,
          p_body: comment
        });
        const snapshot = cacheSnapshot(
          sanitizeSnapshot(rawSnapshot, appId)
        );
        form.reset();
        commentInput.removeAttribute("aria-invalid");
        characterCount.textContent = `0/${MAX_COMMENT_LENGTH}`;
        notifyPanels(appId, snapshot);
        setStatus(formStatus, "Commentaire publié.", "success");
      } catch (error) {
        setStatus(
          formStatus,
          error instanceof Error ? error.message : "Publication impossible.",
          "error"
        );
      } finally {
        submitButton.disabled = false;
      }
    });

    if (adminMode) {
      adminLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = adminEmailInput.value.trim();
        const password = adminPasswordInput.value;

        if (!email || !password) {
          setStatus(adminStatus, "E-mail et mot de passe requis.", "error");
          return;
        }

        adminLoginButton.disabled = true;
        setStatus(adminStatus, "Connexion…", "");

        try {
          const resolved = await signInAdmin(email, password);
          adminAuthenticated = true;
          adminToken = resolved.token;
          adminEmail = resolved.email;
          adminPasswordInput.value = "";
          renderAdminState();
          renderComments(currentSnapshot.comments);
          setStatus(adminStatus, "Administration active.", "success");
        } catch (error) {
          setStatus(
            adminStatus,
            error instanceof Error ? error.message : "Connexion impossible.",
            "error"
          );
        } finally {
          adminLoginButton.disabled = false;
        }
      });

      adminLogoutButton.addEventListener("click", async () => {
        adminLogoutButton.disabled = true;
        await signOutAdmin();
        adminAuthenticated = false;
        adminToken = "";
        adminEmail = "";
        renderAdminState();
        renderComments(currentSnapshot.comments);
        setStatus(adminStatus, "Déconnecté.", "");
        adminLogoutButton.disabled = false;
      });
    }

    mountedPanels.add(mountedPanel);
    container.replaceChildren(panel);
    render(currentSnapshot);

    readyPromise = refresh();
    pollTimer = window.setInterval(() => {
      if (!document.hidden && !destroyed) refreshSnapshot(true);
    }, REFRESH_INTERVAL_MS);

    publicController = Object.freeze({
      appId,
      ready: readyPromise,
      refresh,
      destroy
    });
    controllersByContainer.set(container, publicController);

    return publicController;
  }

  window.addEventListener("online", () => {
    mountedPanels.forEach((mountedPanel) => {
      if (mountedPanel && mountedPanel.appId) {
        loadSharedSnapshot(mountedPanel.appId)
          .then((snapshot) => notifyPanels(mountedPanel.appId, snapshot))
          .catch(() => {});
      }
    });
  });

  window.LauncherSocial = Object.freeze({
    recordVisit,
    getVisitCount,
    mountPanel
  });
})();
