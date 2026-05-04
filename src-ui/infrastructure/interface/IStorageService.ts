import { Result } from "@/shared/types/result";
import { StorageOptions } from "./IStorageProvider";



export interface IStorageService {
    exists(absFilePath: string): Promise<boolean>;
    load(absFilePath: string): Promise<Result>;
    save(absFilePath: string, data: any): Promise<Result>;
    remove(absFilePath: string, options?: StorageOptions): Promise<Result>;
}