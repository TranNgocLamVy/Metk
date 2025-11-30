

export class LocalStorageService {
    public static getItem(key: string, defaultValue?: any): any {
        return localStorage.getItem(key) || defaultValue;
    }

    public static setItem(key: string, value: any): void {
        localStorage.setItem(key, value);
    }

    public static removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    public static clear(): void {
        localStorage.clear();
    }
}