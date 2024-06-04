// sum.test.js
import { expect, describe, it, vi, MockedFunction } from "vitest";
import OAuthService from "../OAuthService";
import PkceService from "../PkceService";
import FakeCookieService from "./FakeCookieService";
import axios from "axios";

describe("OAuth Service Tests", () => {
  describe("When initiateAuthRequest() is called", () => {
    it("should store code verifier in a randomly generated cookie", async () => {
      const cookieService = new FakeCookieService();
      // Arrange
      vi.stubGlobal("location", {
        assign: vi.fn(),
      });

      // Act
      const oAuthService = new OAuthService(new PkceService(cookieService), {
        authUrl: "https://mock-endpoint",
        authorizeUrl: "https://mock-endpoint/authorize",
        tokenUrl: "https://mock-endpoint/oauth/token",
        redirectUri: "https://client-redirect",
        redirectResponseType: ["code", "id_token"],
      });

      await oAuthService.initiateAuthRequest();
      const mockCallArgs = (
        location.assign as MockedFunction<typeof location.assign>
      ).mock.calls[0][0];
      const redirectUrl = new URL(mockCallArgs);
      const generatedRandomCookieKey = redirectUrl.searchParams.get("state");

      // Assert

      // expect the state returns the cookie key
      expect(generatedRandomCookieKey).toBeTruthy();
      // expect the key is present in cookie
      expect(cookieService.testStorage[generatedRandomCookieKey!]).toBeTruthy();
    });
    it("should redirect to authorization endpoint with correct parameters", async () => {
      // Arrange
      vi.stubGlobal("location", {
        assign: vi.fn(),
      });

      // Act
      const oAuthService = new OAuthService(
        new PkceService(new FakeCookieService()),
        {
          authUrl: "https://mock-endpoint",
          authorizeUrl: "https://mock-endpoint/authorize",
          tokenUrl: "https://mock-endpoint/oauth/token",
          redirectUri: "https://client-redirect",
          redirectResponseType: ["code", "id_token"],
        }
      );

      await oAuthService.initiateAuthRequest();

      // Assert
      const mockCallArgs = (
        location.assign as MockedFunction<typeof location.assign>
      ).mock.calls[0][0];
      const redirectUrl = new URL(mockCallArgs);
      // expect all the parameters that are required in query string are present
      expect(redirectUrl.searchParams.get("response_type")).toBe(
        "code,id_token"
      );
      expect(redirectUrl.searchParams.get("redirect_uri")).toBe(
        "https://client-redirect"
      );
      expect(redirectUrl.searchParams.get("state")).toBeTruthy();
      expect(redirectUrl.searchParams.get("code_challenge")).toBeTruthy();
    });
  });
  describe("When getRedirectResult() is called", () => {
    it("should not generate tokens if &state= or &code=code is absent in the url", async () => {
      // Arrange
      vi.stubGlobal("localStorage", {
        getItem: vi.fn(),
        setItem: vi.fn(),
      });

      vi.stubGlobal("location", {
        search: "",
      });

      const oAuthService = new OAuthService(
        new PkceService(new FakeCookieService()),
        {
          authUrl: "https://mock-endpoint",
          authorizeUrl: "https://mock-endpoint/authorize",
          tokenUrl: "https://mock-endpoint/oauth/token",
          redirectUri: "https://client-redirect",
          redirectResponseType: ["code", "id_token"],
        }
      );

      // Act
      const result = await oAuthService.getRedirectResult();

      // Assert
      // assert that the no tokens are generated
      expect(result).toBeNull();
    });
    it("should not generate tokens if code verifier cannot be found in cookie", async () => {
      // Arrange
      vi.stubGlobal("localStorage", {
        getItem: vi.fn(),
        setItem: vi.fn(),
      });

      vi.stubGlobal("location", {
        search: "code=123&state=abc",
      });

      const oAuthConfig = {
        authUrl: "https://mock-endpoint",
        authorizeUrl: "https://mock-endpoint/authorize",
        tokenUrl: "https://mock-endpoint/oauth/token",
        redirectUri: "https://client-redirect",
        redirectResponseType: ["code", "id_token"],
      };

      // Act
      const oAuthService = new OAuthService(
        new PkceService(new FakeCookieService()),
        oAuthConfig
      );
      const result = await oAuthService.getRedirectResult();

      // Assert
      // assert that the no tokens are generated
      expect(result).toBeNull();
    });
    it("should not generate tokens if &code does not match client code verifier stored in cookie", async () => {
      // Arrange

      const code = "123";
      const state = "cookie-key";

      vi.stubGlobal("localStorage", {
        getItem: vi.fn(),
        setItem: vi.fn(),
      });

      // presume the user already has a cookie with cookie-key=code-verifier
      const fakeCookieService = new FakeCookieService();
      fakeCookieService.save(state, "code-verifier");

      vi.stubGlobal("location", {
        search: `code=${code}&state=intentionally-different-state`,
      });

      const oAuthConfig = {
        authUrl: "https://mock-endpoint",
        authorizeUrl: "https://mock-endpoint/authorize",
        tokenUrl: "https://mock-endpoint/oauth/token",
        redirectUri: "https://client-redirect",
        redirectResponseType: ["code", "id_token"],
      };

      // Act
      const oAuthService = new OAuthService(
        new PkceService(fakeCookieService),
        oAuthConfig
      );
      const result = await oAuthService.getRedirectResult();

      expect(result).toBeNull();
    });
    it("should generate tokens if &state matches client code verifier key stored in local storage", async () => {
      // Arrange

      const code = "123";
      const state = "cookie-key";
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      vi.stubGlobal("localStorage", {
        getItem: vi.fn(),
        setItem: vi.fn(),
      });

      // presume the user already has a cookie with cookie-key=code-verifier
      const fakeCookieService = new FakeCookieService();
      fakeCookieService.save(state, "code-verifier");

      vi.stubGlobal("location", {
        search: `code=${code}&state=${state}`,
      });

      const oAuthConfig = {
        authUrl: "https://mock-endpoint",
        authorizeUrl: "https://mock-endpoint/authorize",
        tokenUrl: "https://mock-endpoint/oauth/token",
        redirectUri: "https://client-redirect",
        redirectResponseType: ["code", "id_token"],
      };

      vi.spyOn(axios, "post").mockImplementation((url) => {
        switch (url) {
          case oAuthConfig.tokenUrl:
            return Promise.resolve({
              data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: new Date().getTime(),
              },
            });
          default:
            return Promise.reject(new Error("Invalid URL"));
        }
      });

      // Act
      const oAuthService = new OAuthService(
        new PkceService(fakeCookieService),
        oAuthConfig
      );
      const result = await oAuthService.getRedirectResult();

      expect(result?.accessToken).toBeTruthy();
      expect(result?.refreshToken).toBeTruthy();
    });
    it("should store tokens in localStorage on successful token request", async () => {
      // Arrange
      // in seconds
      const unixTimestamp = Math.floor(new Date().getTime() / 1000);
      const code = "123";
      const state = "cookie-key";
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      vi.stubGlobal("localStorage", {
        getItem: vi.fn(),
        setItem: vi.fn(),
      });

      // presume the user already has a cookie with cookie-key=code-verifier
      const fakeCookieService = new FakeCookieService();
      fakeCookieService.save(state, "code-verifier");

      vi.stubGlobal("location", {
        search: `code=${code}&state=${state}`,
      });

      const oAuthConfig = {
        authUrl: "https://mock-endpoint",
        authorizeUrl: "https://mock-endpoint/authorize",
        tokenUrl: "https://mock-endpoint/oauth/token",
        redirectUri: "https://client-redirect",
        redirectResponseType: ["code", "id_token"],
      };

      vi.spyOn(axios, "post").mockImplementation((url) => {
        switch (url) {
          case oAuthConfig.tokenUrl:
            return Promise.resolve({
              data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: unixTimestamp,
              },
            });
          default:
            return Promise.reject(new Error("Invalid URL"));
        }
      });

      // Act
      const oAuthService = new OAuthService(
        new PkceService(fakeCookieService),
        oAuthConfig
      );
      await oAuthService.getRedirectResult();

      // Assert
      const mockLocalStorageSaveArgs = (
        localStorage.setItem as MockedFunction<typeof localStorage.setItem>
      ).mock.calls;
      // expect localStorage.setItem is called with these values in these order
      expect(mockLocalStorageSaveArgs).toStrictEqual([
        ["access_token", accessToken],
        ["refresh_token", refreshToken],
        ["token_expire_at", unixTimestamp.toString()],
      ]);
    });
  });
});
