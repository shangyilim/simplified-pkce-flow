interface AuthStorage {
    save(key: string, data: string): void;
    get(key: string): Promise<string | undefined>;
    delete(key: string): Promise<void>;
}

interface OAuthServiceConfig {
    authUrl: string;
};

interface OAuthTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

interface OAuthTokenInfo {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

interface GrantOptions {
    'authorization_code': {
        code?: string,
        code_verifier?: string,
    },
    'refresh_token': {
        refresh_token?: string
    }
}