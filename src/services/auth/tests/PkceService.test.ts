// sum.test.js
import { expect, describe, it } from "vitest";
import PkceService from "../PkceService";
import FakeCookieService from "./FakeCookieService";

describe("PKCE Service Tests", () => {
  describe("Code verifier", () => {
    it("should generate a random code verifier", () => {
      // Arrange
      const pkceService = new PkceService(new FakeCookieService());

      // Act
      const codeChallenge1 = pkceService.generateCodeVerifier();
      const codeChallenge2 = pkceService.generateCodeVerifier();

      // Assert
      // expect that code 1 generated is not empty
      expect(codeChallenge1).toBeTruthy();
      // expect that code 2 generated is not empty
      expect(codeChallenge2).toBeTruthy();
      // expect that code 1 and 2 should not match
      expect(codeChallenge1).not.equal(codeChallenge2);
    });
    it("should generate 43 character length code verifier", () => {
      // Arrange
      const pkceService = new PkceService(new FakeCookieService());
      //Act
      const codeChallenge = pkceService.generateCodeVerifier();
      // Assert
      expect(codeChallenge.length).toBe(43);
    });

    it("should store the code verifier", async () => {
      // Arrange
      const fakeCookieService = new FakeCookieService();
      const pkceService = new PkceService(fakeCookieService);
      const codeVerifier = "code-verifier";

      // Act
      const storageKey = pkceService.storeCodeVerifier(codeVerifier);

      // Assert
      // expect that the fake storage contains the code verifier
      expect(codeVerifier).toBe(fakeCookieService.testStorage[storageKey]);
    });

    it("should get the code verifier", async () => {
      // Arrange
      const fakeCookieService = new FakeCookieService();
      const pkceService = new PkceService(fakeCookieService);
      const codeVerifier = "code-verifier";

      // Act
      const storageKey = pkceService.storeCodeVerifier(codeVerifier);
      const storedCode = await pkceService.getCodeVerfier(storageKey);

      // Assert
      // expect that stored code can be retrieved
      expect(codeVerifier).toBe(storedCode);
    });

    it("should delete the code verifier", async () => {
      // Arrange
      const fakeCookieService = new FakeCookieService();
      const pkceService = new PkceService(fakeCookieService);
      const codeVerifier = "code-verifier";

      // Act
      const storageKey = pkceService.storeCodeVerifier(codeVerifier);
      await pkceService.deleteCodeVerifier(storageKey);

      // Assert
      // expect that stored code is deleted
      expect(fakeCookieService.testStorage[storageKey]).toBeFalsy();
    });

    it("should prefix the storage key when provided in options", async () => {
      // Arrange
      const fakeCookieService = new FakeCookieService();
      const prefix = "prefix-1";
      const pkceService = new PkceService(fakeCookieService, {
        keyPrefix: prefix,
      });
      const codeVerifier = "code-verifier";

      // Act
      const storageKey = pkceService.storeCodeVerifier(codeVerifier);

      // Assert
      expect(codeVerifier).toBe(
        fakeCookieService.testStorage[`${prefix}${storageKey}`]
      );
    });
  });

  it("should generate a code challenge by verifier code ", async () => {
    // Arrange
    const pkceService = new PkceService(new FakeCookieService());
    const codeVerifier = "code-verifier";

    // Act
    const codeChallenge = await pkceService.generateCodeChallenge(codeVerifier);

    // Assert
    expect(codeChallenge).toBe(
      "YTlkODBiMmQxYWY1YjFhMTQ3NGZhMGQ2N2Q2NTM2ZjE1MzRmMjIyZWRlZjcyOWM0MDY3MDQ2ZGNlNjlkYzNkOA=="
    );
  });
});
