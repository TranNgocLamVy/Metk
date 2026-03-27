// IStorageProvider.ts
import { Result } from "@/shared/types/result";

export interface IStorageProvider {
    exists(path: string, options?: any): Promise<boolean>;
    readText(path: string, options?: any): Promise<Result<string>>;
    writeText(path: string, content: string, options?: any): Promise<Result>;
}