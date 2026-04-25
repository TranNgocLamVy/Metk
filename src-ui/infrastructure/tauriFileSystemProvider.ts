import { create, exists, mkdir, readFile, readTextFile, remove, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { IStorageProvider, StorageOptions } from "./interface/IStorageProvider";
import { Result } from "@/shared/types/result";
import i18n from "@/core/service/i18n";

export class TauriFileSystemProvider implements IStorageProvider {
    public async exists(path: string, options?: StorageOptions): Promise<boolean> {
        return await exists(path, options);
    }

    public async mkdir(path: string, options?: StorageOptions): Promise<Result> {
        try {
            await mkdir(path, options);
            return Result.Success();
        } catch (error) {
            return Result.Error({ key: "message.system.fs.mkdirFail", options: { error, path } });
        }
    }

    public async readTextFile(path: string, options?: StorageOptions): Promise<Result<string>> {
        try {
            if (!(await this.exists(path, options))) {
                return Result.Error({ key: "message.system.fs.fileNotFoundAt", options: { path }});
            }
            const data = await readTextFile(path, options);
            return Result.Success(data);
        } catch (error) {
            return Result.Error({ key: "message.system.fs.readFail", options: { error, path }});
        }
    }

    public async writeTextFile(path: string, content: string, options?: StorageOptions): Promise<Result> {
        try {
            if (await this.exists(path, options)) {
                await writeTextFile(path, content, options);
            } else {
                const file = await create(path, options);
                await file.write(new TextEncoder().encode(content));
                await file.close();
            }
            return Result.Success();
        } catch (error) {
            return Result.Error({ key: "message.system.fs.writeFail", options: { error, path }});
        }
    }

    public async readFile(path: string, options?: StorageOptions): Promise<Result<Uint8Array>> {
        try {
            if (!(await this.exists(path, options))) {
                return Result.Error({key: "message.system.fs.fileNotFoundAt", options: { path }});
            }
            const data = await readFile(path, options);
            return Result.Success(data);
        } catch (error) {
            return Result.Error({ key: "message.system.fs.readFail", options: { error, path }});
        }
    }

    public async writeFile(path: string, content: Uint8Array, options?: StorageOptions): Promise<Result> {
        try {
            if (await this.exists(path, options)) {
                await writeFile(path, content, options);
            } else {
                const file = await create(path, options);
                await file.write(content);
                await file.close();
            }
            return Result.Success();
        } catch (error) {
            return Result.Error({ key: "message.system.fs.writeFail", options: { error, path }});
        }
    }

    public async removeFile(path: string, options?: StorageOptions): Promise<Result> {
        try {
            if (await this.exists(path, options)) {
                await remove(path, options);
            }
            return Result.Success();
        } catch (error) {
            return Result.Error({ key: "message.system.fs.removeFail", options: { error, path }});
        }
    }
}