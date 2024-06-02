import { cookieStore } from "cookie-store";

class CookieStorage implements AuthStorage {
    save(key: string, value: string): void {
        document.cookie=`${key}=${value}; Secure; SameSite=Strict`;
    }
    async get(key: string): Promise<string|undefined> {
        const result = await cookieStore.get(key);
        return result?.value;
    }
    delete(key: string){
        return cookieStore.delete(key);
    }
}

export default CookieStorage;