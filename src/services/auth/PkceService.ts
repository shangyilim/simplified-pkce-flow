import CookieStorage from "./CookieStorage";

class PkceService {
    private keyStorage: CookieStorage;
    
    constructor(keyStorage: CookieStorage) {
        this.keyStorage = keyStorage;
    }
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
    public generateCodeVerifier() {
        return `${crypto.randomUUID()}${crypto.randomUUID()}`;
    }
    public storeCodeVerifier(codeVerifier: string) {
        const randomString = this.generateRandomString(20);
        const codeVerifierKey =`app.txs.${randomString}`
        this.keyStorage.save(codeVerifierKey, codeVerifier);
        return randomString;
    }
    public getCodeVerfier(name: string){
        return this.keyStorage.get(`app.txs.${name}`)
    }
    public deleteCodeVerifier(name: string){
        return this.keyStorage.delete(name);
    }
   
    private generateRandomString(length: number) {
        const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          result += charset[randomIndex];
        }
        return result;
      }

}

export default PkceService;