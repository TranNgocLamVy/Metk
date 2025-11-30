import { FileHandle, open } from "@tauri-apps/plugin-fs";

import { Result } from "../types/result";

export class ProjectFileUtils {
    constructor() { }

    public async openFile(filePath: string): Promise<FileHandle> {
        const file = await open(filePath);
        return file;
    }

    public async writeFile(filePath: string, content: Buffer): Promise<Result> {
        try {
            const file = await open(filePath, { write: true });
            await file.write(content);
            await file.close();
            return { status: "Success" };
        } catch (error) {
            return { status: "Error", message: error as any };
        }
    }
}