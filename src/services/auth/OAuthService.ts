import axios from "axios";
import PkceService from "./PkceService";

/**
 * Handles the refresh token rotation that is used in conjunction with the Authorization Code Flow with PKCE
 */
class OAuthService {
  private pkceService: PkceService;
  private config: OAuthServiceConfig;
  private local_storage_access_token_key = "access_token";
  private local_storage_refresh_token_key = "refresh_token";
  private local_storage_token_expiry_key = "token_expire_at";

  constructor(pkceService: PkceService, config: OAuthServiceConfig) {
    this.pkceService = pkceService;
    this.config = config;
  }

  /**
   * Initiate the authorization request to the oAuth server
   */
  public async initiateAuthRequest() {
    const codeVerifier = this.pkceService.generateCodeVerifier();
    const codeVerifierKey = this.pkceService.storeCodeVerifier(codeVerifier);
    const codeChallenge = await this.pkceService.generateCodeChallenge(
      codeVerifier
    );

    this.redirectToAuthorization({
      responseType: this.config.redirectResponseType,
      redirectUri: this.config.redirectUri,
      state: codeVerifierKey,
      codeChallenge,
    });
  }

  /**
   * Process the authorization code return from the server to exchange for an access and refresh token
   * @returns OAuthTokenInfo
   */
  public async getRedirectResult(): Promise<OAuthTokenInfo | null> {
    const refreshedTokenInfo = await this.refreshTokenWhenNecessary();
    if (refreshedTokenInfo) {
      return refreshedTokenInfo;
    }

    const urlParams = new URLSearchParams(location.search);

    const state = urlParams.get("state");
    const code = urlParams.get("code");

    if (!state || !code) {
      return null;
    }

    const codeVerifier = await this.pkceService.getCodeVerfier(state);
    if (!codeVerifier) {
      return null;
    }

    await this.pkceService.deleteCodeVerifier(state);
    const tokenInfo = await this.exchangeCodeForToken(code, codeVerifier);

    this.storeTokenInfo(tokenInfo);

    return tokenInfo;
  }

  /**
   * Redirects the current window to the authorization endpoint
   * @param options
   */
  private redirectToAuthorization(options: {
    responseType: string[];
    redirectUri: string;
    state: string;
    codeChallenge: string;
  }) {
    const { responseType, redirectUri, state, codeChallenge } = options;
    const endpoint = new URL(this.config.authorizeUrl);
    endpoint.searchParams.set("response_type", responseType.join(","));
    endpoint.searchParams.set("redirect_uri", redirectUri);
    endpoint.searchParams.set("state", state);
    endpoint.searchParams.set("code_challenge", codeChallenge);

    location.assign(endpoint.toString());
  }

  /**
   * Exchanges the supplied code and code verifier for access token
   * @param code authorization code given by the authorization server
   * @param codeVerifier generated from the client
   * @returns
   */
  private exchangeCodeForToken(code: string, codeVerifier: string) {
    return this.requestToken("authorization_code", {
      code,
      code_verifier: codeVerifier,
    });
  }

  /**
   * Checks whether an existing refresh token is present before refreshing a new one
   * @returns OAuthTokenInfo | null
   */
  private async refreshTokenWhenNecessary() {
    const refreshToken = localStorage.getItem(
      this.local_storage_refresh_token_key
    );
    if (!refreshToken) {
      return null;
    }

    // TO-DO: check when access token expires before refreshing

    const tokenInfo = await this.requestToken("refresh_token", {
      refresh_token: refreshToken,
    });

    this.storeTokenInfo(tokenInfo);

    return tokenInfo;
  }

  /**
   * Request for access and refresh tokens based on the grantType
   * @param grantType 'authorization_code' | 'refresh_token'
   * @param options options needed for different grant types
   * @returns
   */
  private async requestToken<T extends keyof GrantOptions>(
    grantType: T,
    options: GrantOptions[T]
  ) {
    const response = await axios.post<OAuthTokenResponse>(
      this.config.tokenUrl,
      {
        grant_type: grantType,
        ...options,
      }
    );

    return {
      expiresAt: response.data.expires_at,
      refreshToken: response.data.refresh_token,
      accessToken: response.data.access_token,
    } as OAuthTokenInfo;
  }

  /**
   * Stores the token info the local storage
   * @param token
   */
  private storeTokenInfo(token: OAuthTokenInfo) {
    localStorage.setItem(
      this.local_storage_access_token_key,
      token.accessToken
    );
    localStorage.setItem(
      this.local_storage_refresh_token_key,
      token.refreshToken
    );
    localStorage.setItem(
      this.local_storage_token_expiry_key,
      token.expiresAt.toString()
    );
  }
}

export default OAuthService;
