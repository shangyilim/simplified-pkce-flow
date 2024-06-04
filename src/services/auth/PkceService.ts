import CookieStorage from "./CookieStorage";

/**
 * Handles generation of data needed for a PKCE flow
 */
class PkceService {
  private keyStorage: CookieStorage;
  private options: {
    keyPrefix: string;
  };
  constructor(keyStorage: CookieStorage, options?: PkceService["options"]) {
    this.keyStorage = keyStorage;
    this.options = {
      keyPrefix: options?.keyPrefix ?? "",
    };
  }
  /**
   * Generates a Base64-URL-encoded SHA256 hash of the code verifier
   * @param codeVerifier
   * @returns
   */
  public async generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
    return btoa(hashHex);
  }
  /**
   * Generates a cryptographically random string
   * @returns string
   */
  public generateCodeVerifier() {
    const uuid1 = crypto.randomUUID().replace(/-/g, "");
    const uuid2 = crypto.randomUUID().replace(/-/g, "");
    return `${uuid1}${uuid2}`.slice(0, 43);
  }
  /**
   * Stores the code verifier into storage
   * @param codeVerifier
   * @returns
   */
  public storeCodeVerifier(codeVerifier: string) {
    const randomString = this.generateRandomString(20);
    const codeVerifierKey = `${this.options.keyPrefix}${randomString}`;
    this.keyStorage.save(codeVerifierKey, codeVerifier);
    return randomString;
  }
  /**
   * Gets the code verifier from storage by its key
   * @param name key from which it was stored
   * @returns
   */
  public getCodeVerfier(name: string) {
    return this.keyStorage.get(`${this.options.keyPrefix}${name}`);
  }
  /**
   * Deletes the code verifier from storage by its key
   * @param name key from which it was stored
   * @returns
   */
  public deleteCodeVerifier(name: string) {
    return this.keyStorage.delete(name);
  }

  /**
   * Generates a random alphanumerical string by its length
   * @param length number of characters to generate
   * @returns
   */
  private generateRandomString(length: number) {
    const charset =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    return result;
  }
}

export default PkceService;
