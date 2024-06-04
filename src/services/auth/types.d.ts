/**
 * Interface to implement storage
 */
interface AuthStorage {
  save(key: string, data: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
}
/**
 * Configuration settings for the OAuthService
 */
interface OAuthServiceConfig {
  authUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  redirectUri: string;
  redirectResponseType: string[];
}
/**
 * Token payload returned from the server
 */
interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
/**
 * App interface of the OAuthTokenResponse
 */
interface OAuthTokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
/**
 * Specifies the configuration needed for different grant options 
 */
interface GrantOptions {
  authorization_code: {
    code: string;
    code_verifier: string;
  };
  refresh_token: {
    refresh_token: string;
  };
}
