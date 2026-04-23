import { Result } from "@/shared/types/result";
import { ISerializer } from "./interface/ISerializer";
import { IStorageProvider, StorageOptions } from "./interface/IStorageProvider";

export class JsonFileRepository<T> {
    private writeQueues: Map<string, Promise<Result>> = new Map();
    constructor(
        private storage: IStorageProvider,
        private serializer: ISerializer<T>,
        private defaultOptions?: StorageOptions,
    ) { }

    public async load(absFilePath: string): Promise<Result<T>> {
        const readResult = await this.storage.readTextFile(absFilePath, this.defaultOptions);
        if (readResult.status != Result.Status.Success) return Result.Error(readResult.message);

        return this.serializer.deserialize(readResult.data);
    }

    public async save(absPath: string, data: any): Promise<Result> {
        const currentQueue = this.writeQueues.get(absPath) || Promise.resolve();

        const nextInQueue = currentQueue.then(async () => {
            return await this.performSave(absPath, data);
        }).catch(error => {
            console.error(`Error in write queue for ${absPath}:`, error);
            return Result.Error(`Failed to save: ${error}`); 
        });

        this.writeQueues.set(absPath, nextInQueue);

        try {
            const result = await nextInQueue;
            return result as Result;
        } finally {
            if (this.writeQueues.get(absPath) === nextInQueue) {
                this.writeQueues.delete(absPath);
            }
        }
    }

    public async remove(absPath: string, options?: StorageOptions): Promise<Result> {
        return await this.storage.removeFile(absPath, options);
    }

    private async performSave(absFilePath: string, data: any): Promise<Result> {
        try {
            const serializedResult = this.serializer.serialize(data);
            if (serializedResult.status != Result.Status.Success) return serializedResult;

            return await this.storage.writeTextFile(absFilePath, serializedResult.data, this.defaultOptions);
        } catch (error) {
            return Result.Error(`Disk write failed: ${error}`);
        }
    }
}