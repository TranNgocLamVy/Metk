import { BaseDirectory, create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { IStorageProvider } from "./interface/IStorageProvider";
import { Result } from "@/shared/types/result";

export class TauriFileSystemProvider implements IStorageProvider {
    async exists(path: string, options?: any): Promise<boolean> {
        return await exists(path, options);
    }

    async readText(path: string, options?: any): Promise<Result<string>> {
        try {
            if (!(await this.exists(path, options))) {
                return { status: "Error", message: "File not found" };
            }
            const data = await readTextFile(path, options);
            return { status: "Success", data };
        } catch (error) {
            return { status: "Error", message: `Read error: ${error}` };
        }
    }

    async writeText(path: string, content: string, options?: any): Promise<Result> {
        try {
            if (await this.exists(path, options)) {
                await writeTextFile(path, content, options);
            } else {
                const file = await create(path, options);
                await file.write(new TextEncoder().encode(content));
                await file.close();
            }
            return { status: "Success", data: null };
        } catch (error) {
            return { status: "Error", message: `Write error: ${error}` };
        }
    }
}