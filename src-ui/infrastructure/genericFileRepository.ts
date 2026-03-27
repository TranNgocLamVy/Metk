
import { Result } from "@/shared/types/result";
import { ISerializer } from "./interface/ISerializer";
import { IStorageProvider } from "./interface/IStorageProvider";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

export class GenericFileRepository<T> {
    constructor(
        private storage: IStorageProvider,
        private serializer: ISerializer<T>,
        private defaultOptions?: any // VD: { baseDir: BaseDirectory.AppData }
    ) {}

    public async load(absFilePath: string): Promise<Result<T>> {
        const readResult = await this.storage.readText(absFilePath, this.defaultOptions);
        if (readResult.status != Result.Status.Success) return Result.Error(readResult.message);

        return this.serializer.deserialize(readResult.data);
    }

    public async save(absFilePath: string, data: T): Promise<Result> {
        const serializedResult = this.serializer.serialize(data);
        if (serializedResult.status != Result.Status.Success) return serializedResult;

        return await this.storage.writeText(absFilePath, serializedResult.data, this.defaultOptions);
    }
}