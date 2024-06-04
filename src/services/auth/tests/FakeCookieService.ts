class FakeCookieService implements AuthStorage {
  public testStorage: Record<string, string>;
  constructor() {
    this.testStorage = {};
  }
  save(key: string, data: string): Promise<void> {
    this.testStorage[key] = data;
    return Promise.resolve();
  }
  get(key: string): Promise<string | undefined> {
    return Promise.resolve(this.testStorage[key]);
  }
  delete(key: string): Promise<void> {
    delete this.testStorage[key];
    return Promise.resolve();
  }
}
export default FakeCookieService;
