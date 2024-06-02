import axios from "axios";
import PkceService from "./PkceService";


class OAuthService {
    private pkceService: PkceService;
    private config: OAuthServiceConfig;
    private local_storage_access_token_key = 'access_token';
    private local_storage_refresh_token_key = 'refresh_token';
    private local_storage_token_expiry_key = 'expiry_token';

    constructor(pkceService: PkceService, config: OAuthServiceConfig) {
        this.pkceService = pkceService;
        this.config = config;
    }


    public async initiateAuthRequest() {
        const codeVerifier = this.pkceService.generateCodeVerifier();
        const codeVerifierKey = this.pkceService.storeCodeVerifier(codeVerifier);
        const codeChallenge = await this.pkceService.generateCodeChallenge(codeVerifier);

        this.redirectToAuthorization({
            responseType: ['code', 'id_token'],
            redirectUri: location.href,
            state: codeVerifierKey,
            codeChallenge,
        });
    }


    public async getRedirectResult() {

        const refreshedTokenInfo =  await this.refreshTokenWhenNecessary();
        if(refreshedTokenInfo){
            return refreshedTokenInfo;
        }

        const urlParams = new URLSearchParams(location.search);

        const state = urlParams.get('state');
        const code = urlParams.get('code');

        if (!state || !code) {
            return null;
        }

        const codeVerifier = await this.pkceService.getCodeVerfier(state);

        if (!codeVerifier) {
            throw new Error('No existing code verifier found');
        }

        await this.pkceService.deleteCodeVerifier(state);
        const tokenInfo = await this.exchangeCodeForToken(code, codeVerifier);

        this.storeTokenInfo(tokenInfo);

        return tokenInfo;
    }

    private redirectToAuthorization(options: {
        responseType: string[];
        redirectUri: string;
        state: string;
        codeChallenge: string;
    }) {

        const { responseType, redirectUri, state, codeChallenge } = options;
        const endpoint = new URL(this.getAuthorizationEndpoint());
        endpoint.searchParams.set('response_type', responseType.join(','));
        endpoint.searchParams.set('redirect_uri', redirectUri);
        endpoint.searchParams.set('state', state);
        endpoint.searchParams.set('code_challenge', codeChallenge);

        location.assign(endpoint.toString());
    }
    private getAuthorizationEndpoint() {
        return `${this.config.authUrl}/authorize`;
    }
    private getTokenEndpoint() {
        return `${this.config.authUrl}/oauth/token`;
    }
    private exchangeCodeForToken(code: string, codeVerifier: string,) {
        return this.requestToken(
            'authorization_code',
            {
                code,
                code_verifier: codeVerifier,
            }
        )
    }
    private async refreshTokenWhenNecessary(){
        const refreshToken = localStorage.getItem(this.local_storage_refresh_token_key);
        if(!refreshToken){
            return null;
        }

        // TO-DO: check when access token nearing expiry date before refreshing

        const tokenInfo = await this.requestToken('refresh_token', {
            refresh_token: refreshToken
        });

        this.storeTokenInfo(tokenInfo);

        return tokenInfo;
    }
    private async requestToken<T extends keyof GrantOptions>(
        grantType: T,
        options: GrantOptions[T]) {

        const response = await axios.post<OAuthTokenResponse>(this.getTokenEndpoint(), {
            "grant_type": grantType,
            ...options,
        });

        return {
            expiresAt: response.data.expires_at,
            refreshToken: response.data.refresh_token,
            accessToken: response.data.access_token,
        } as OAuthTokenInfo;

    }
    private storeTokenInfo(info: OAuthTokenInfo){
        localStorage.setItem(this.local_storage_access_token_key, info.accessToken);
        localStorage.setItem(this.local_storage_refresh_token_key, info.refreshToken);
        localStorage.setItem(this.local_storage_token_expiry_key, info.expiresAt.toString());
    }
    
}

export default OAuthService;