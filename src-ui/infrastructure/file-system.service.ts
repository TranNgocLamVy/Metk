import { Result } from "@/shared/types/result";
import { IFileSystemService } from "./interface/file-system-service.interface";
import { CopyFileOptions, DirectoryEntry, IStorageProvider, StorageOptions } from "./interface/storage-provider.interface";

export class FileSystemServiceImpl implements IFileSystemService {
    constructor(private readonly storage: IStorageProvider) {}

    public async exists(path: string, options?: StorageOptions): Promise<boolean> {
        return await this.storage.exists(path, options);
    }

    public async readDir(path: string, options?: StorageOptions): Promise<DirectoryEntry[]> {
        const result = await this.storage.readDir(path, options);
        if (result.status !== Result.Status.Success) {
            throw new Error(resolveMessage(result.message));
        }
        return result.data;
    }

    public async readFile(path: string, options?: StorageOptions): Promise<Uint8Array> {
        const result = await this.storage.readFile(path, options);
        if (result.status !== Result.Status.Success) {
            throw new Error(resolveMessage(result.message));
        }
        return result.data;
    }

    public async readTextFile(path: string, options?: StorageOptions): Promise<string> {
        const result = await this.storage.readTextFile(path, options);
        if (result.status !== Result.Status.Success) {
            throw new Error(resolveMessage(result.message));
        }
        return result.data;
    }

    public async copyFile(fromPath: string, toPath: string, options?: CopyFileOptions): Promise<Result> {
        return await this.storage.copyFile(fromPath, toPath, options);
    }

    public async writeFile(path: string, content: Uint8Array, options?: StorageOptions): Promise<Result> {
        return await this.storage.writeFile(path, content, options);
    }

    public async writeTextFile(path: string, content: string, options?: StorageOptions): Promise<Result> {
        return await this.storage.writeTextFile(path, content, options);
    }

    public async mkdir(path: string, options?: StorageOptions): Promise<Result> {
        return await this.storage.mkdir(path, options);
    }

    public async removeFile(path: string, options?: StorageOptions): Promise<Result> {
        return await this.storage.removeFile(path, options);
    }
}

function resolveMessage(message: Result["message"]): string {
    if (!message) return "Filesystem operation failed";
    if (typeof message === "string") return message;
    return message.key;
}
