import { cookieStore } from "cookie-store";

type CookieSameSite = Exclude<
  Parameters<typeof cookieStore.set>[0],
  string
>["sameSite"];
/**
 * A cookie storage implementation.
 */
class CookieStorage implements AuthStorage {
  save(key: string, value: string) {
    return cookieStore.set({
      name: key,
      value,
      secure: true,
      sameSite: "strict" as CookieSameSite,
      domain: null,
      expires: null,
    });
  }
  async get(key: string): Promise<string | undefined> {
    const result = await cookieStore.get(key);
    return result?.value;
  }
  delete(key: string) {
    return cookieStore.delete(key);
  }
}

export default CookieStorage;
