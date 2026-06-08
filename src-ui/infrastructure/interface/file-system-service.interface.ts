import { Result } from "@/shared/types/result";
import { CopyFileOptions, DirectoryEntry, StorageOptions } from "./storage-provider.interface";

export interface IFileSystemService {
    exists(path: string, options?: StorageOptions): Promise<boolean>;
    readDir(path: string, options?: StorageOptions): Promise<DirectoryEntry[]>;
    readFile(path: string, options?: StorageOptions): Promise<Uint8Array>;
    readTextFile(path: string, options?: StorageOptions): Promise<string>;
    copyFile(fromPath: string, toPath: string, options?: CopyFileOptions): Promise<Result>;
    writeFile(path: string, content: Uint8Array, options?: StorageOptions): Promise<Result>;
    writeTextFile(path: string, content: string, options?: StorageOptions): Promise<Result>;
    mkdir(path: string, options?: StorageOptions): Promise<Result>;
    removeFile(path: string, options?: StorageOptions): Promise<Result>;
}
