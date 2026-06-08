import { Result } from "@/shared/types/result";

export type StorageOptions = {
    baseDir?: any;
    recursive?: boolean;
}

export type CopyFileOptions = {
    fromPathBaseDir?: any;
    toPathBaseDir?: any;
};

export type DirectoryEntry = {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink?: boolean;
};

export interface IStorageProvider {
    exists(path: string, options?: StorageOptions): Promise<boolean>;
    mkdir(path: string, options?: StorageOptions): Promise<Result>;
    readDir(path: string, options?: StorageOptions): Promise<Result<DirectoryEntry[]>>;
    copyFile(fromPath: string, toPath: string, options?: CopyFileOptions): Promise<Result>;
    readTextFile(path: string, options?: StorageOptions): Promise<Result<string>>;
    writeTextFile(path: string, content: string, options?: StorageOptions): Promise<Result>;
    readFile(path: string, options?: StorageOptions): Promise<Result<Uint8Array>>;
    writeFile(path: string, content: Uint8Array, options?: StorageOptions): Promise<Result>;
    removeFile(path: string, options?: StorageOptions): Promise<Result>;
}
