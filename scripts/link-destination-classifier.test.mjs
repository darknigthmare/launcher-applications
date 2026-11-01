import test from "node:test";
import assert from "node:assert/strict";
import { classifyLinkDestination } from "./link-destination-classifier.mjs";

const requestedUrl="https://vortex-command-darknigthmares-projects.vercel.app/";

test("Vercel SSO redirect returning HTTP 200 is not a playable game",()=>{
  const result=classifyLinkDestination({
    requestedUrl,
    effectiveUrl:"https://vercel.com/login?next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fvortex-command-darknigthmares-projects.vercel.app%252F",
    status:200
  });
  assert.equal(result.state,"auth-required");
});

test("same-origin working game remains HTTP reachable (not necessarily latest version)",()=>{
  const result=classifyLinkDestination({requestedUrl,effectiveUrl:requestedUrl,status:200});
  assert.equal(result.state,"reachable");
});

test("cross-origin 200 requires identity review",()=>{
  const result=classifyLinkDestination({requestedUrl,effectiveUrl:"https://other-game.vercel.app/",status:200});
  assert.equal(result.state,"needs-review");
});

test("404 is broken and 503 is provisional",()=>{
  assert.equal(classifyLinkDestination({requestedUrl,effectiveUrl:requestedUrl,status:404}).state,"broken");
  assert.equal(classifyLinkDestination({requestedUrl,effectiveUrl:requestedUrl,status:503}).state,"needs-review");
});

test("login/403 or protection header cannot be classified as publicly reachable",()=>{
  assert.equal(classifyLinkDestination({requestedUrl,effectiveUrl:requestedUrl,status:403}).state,"needs-review");
  assert.equal(classifyLinkDestination({requestedUrl,effectiveUrl:requestedUrl,status:200,
    headers:{"x-vercel-protection":"required"}}).state,"auth-required");
});
