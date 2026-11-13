/**
 * Classify an HTTP destination, not just its status code.
 * Vercel SSO sends visitors to vercel.com/login and returns 200 after
 * following the redirect: that is not a publicly playable game.
 */
export function classifyLinkDestination({requestedUrl,effectiveUrl,status,headers={},body=""}) {
  const target=new URL(requestedUrl);
  const actual=new URL(effectiveUrl||requestedUrl);
  const hostname=actual.hostname.toLowerCase();
  const isVercelLogin=(hostname==="vercel.com"||hostname==="www.vercel.com")
    && (/^\/(?:login|sso-api|auth)(?:\/|$)/i.test(actual.pathname)
    || /(?:^|[?&])next=(?:%2f|\/)sso-api/i.test(actual.search));
  const normalizedHeaders=new Headers(headers);
  const protectionHeaders=[normalizedHeaders.get("x-vercel-protection"),normalizedHeaders.get("x-vercel-authenticated")];
  // Password-protected deployments can serve their gate on the game's own URL.
  // Only match the vendor's explicit document title, not a game's login copy.
  const isVercelGate=/<title\b[^>]*>\s*Vercel Authentication\s*<\/title\s*>/i.test(body);
  if(isVercelLogin||isVercelGate||protectionHeaders.some(value=>String(value||"").toLowerCase().includes("required"))){
    return {state:"auth-required",reason:"Redirection vers l'authentification Vercel — le jeu n'est pas accessible sans session"};
  }
  if([401,403].includes(status)){
    return {state:"needs-review",reason:"Accès refusé par le serveur (authentification ou restriction possibles)"};
  }
  if(status>=300&&status<400){
    return {state:"needs-review",reason:"Redirection HTTP non résolue : la destination finale n'a pas été reçue"};
  }
  if(status>=200&&status<300){
    if(target.origin!==actual.origin) {
      // Different domain can be a legitimate alias (not a broken game).
      // Unknown destination requires review until its app identity is confirmed.
      return {state:"needs-review",reason:"Origine finale différente : vérifier le contenu réellement servi et sa connexion HTTPS"};
    }
    return {state:"reachable",reason:"Réponse HTTP reçue sur le domaine attendu; identité/version du jeu non certifiées"};
  }
  if([429,500,502,503,504].includes(status)){
    return {state:"needs-review",reason:"Erreur temporaire ou limitation, nouvelle vérification requise"};
  }
  return {state:"broken",reason:"Échec HTTP explicite sur l'URL du launcher"};
}

/** Preserve the HTTP observation while keeping an unpublished game disabled. */
export function applyPublicationPolicy(result, accessPolicy) {
  if(accessPolicy!=="deployment-pending")return result;
  return {...result,
    destinationState:result.state,
    destinationReason:result.reason||"",
    state:"publication-pending",
    reason:"Publication Vercel en attente ; le lancement reste désactivé dans le launcher"
  };
}
