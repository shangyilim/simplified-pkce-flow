import OAuthService from "./OAuthService";
import PkceService from "./PkceService";
import CookieStorage from "./CookieStorage";

const pkceService = new PkceService(new CookieStorage(), {
  keyPrefix: "app.txs.",
});
const authService = new OAuthService(pkceService, {
  authUrl: "https://interview-api.vercel.app/api",
  authorizeUrl: "https://interview-api.vercel.app/api/authorize",
  tokenUrl: "https://interview-api.vercel.app/api/oauth/token",
  redirectUri: location.href,
  redirectResponseType: ["code", "id_token"],
});

export default authService;
