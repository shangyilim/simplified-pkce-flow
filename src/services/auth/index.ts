import OAuthService from './OAuthService';
import PkceService from './PkceService';
import CookieStorage from './CookieStorage';


const pkceService = new PkceService(new CookieStorage());
const authService = new OAuthService(pkceService, {
    authUrl: 'https://interview-api.vercel.app/api',
})

export default authService

