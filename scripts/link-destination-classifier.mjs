/**
 * Classify an HTTP destination, not just its status code.
 * Vercel SSO sends visitors to vercel.com/login and returns 200 after
 * following the redirect: that is not a publicly playable game.
 */
export function classifyLinkDestination({requestedUrl,effectiveUrl,status,headers={}}) {
  const target=new URL(requestedUrl);
  const actual=new URL(effectiveUrl||requestedUrl);
  const hostname=actual.hostname.toLowerCase();
  const isVercelLogin=(hostname==="vercel.com"||hostname==="www.vercel.com")
    && (/^\/(?:login|sso-api|auth)(?:\/|$)/i.test(actual.pathname)
    || /(?:^|[?&])next=(?:%2f|\/)sso-api/i.test(actual.search));
  const protectionHeader=String(headers["x-vercel-protection"]||headers["x-vercel-authenticated"]||"").toLowerCase();
  if(isVercelLogin||protectionHeader.includes("required")){
    return {state:"auth-required",reason:"Redirection vers l'authentification Vercel — le jeu n'est pas accessible sans session"};
  }
  if([401,403].includes(status)){
    return {state:"needs-review",reason:"Accès refusé par le serveur (authentification ou restriction possibles)"};
  }
  if(status>=200&&status<400){
    if(target.hostname!==actual.hostname) {
      // Different domain can be a legitimate alias (not a broken game).
      // Unknown destination requires review until its app identity is confirmed.
      return {state:"needs-review",reason:"Domaine final différent : vérifier le contenu réellement servi"};
    }
    return {state:"reachable",reason:"Réponse HTTP reçue sur le domaine attendu; identité/version du jeu non certifiées"};
  }
  if([429,500,502,503,504].includes(status)){
    return {state:"needs-review",reason:"Erreur temporaire ou limitation, nouvelle vérification requise"};
  }
  return {state:"broken",reason:"Échec HTTP explicite sur l'URL du launcher"};
}
