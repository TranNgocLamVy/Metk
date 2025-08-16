// src/utils/FileUtils.ts
import { appDataDir } from "@tauri-apps/api/path";
import { BaseDirectory, create, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export class FileUtils {
    public static async ensureAppDataDir() {
        const dir = await appDataDir()
        const dirExists = await exists(dir.toString());
        if (!dirExists) {
            await mkdir(dir);
        }
    }
    
    public static async readTextFile(path: string, baseDir: BaseDirectory): Promise<string | null> {
        const isExists = await exists(path, { baseDir });
        if (isExists) {
            return await readTextFile(path, { baseDir });
        }
        return null;
    }

    public static async readOrCreateTextFile(path: string, baseDir: BaseDirectory, defaultContent: string): Promise<string> {
        const isExists = await exists(path, { baseDir });
        if (isExists) {
            return await readTextFile(path, { baseDir });
        }
        const file = await create(path, { baseDir });
        await file.write(new TextEncoder().encode(defaultContent));
        await file.close();
        return defaultContent;
    }
    
    public static async writeTextFile(path: string, baseDir: BaseDirectory, content: string): Promise<void> {
        const isExists = await exists(path, { baseDir });
        if (isExists) {
            await writeTextFile(path, content, { baseDir });
            return;
        }

        const file = await create(path, { baseDir });
        await file.write(new TextEncoder().encode(content));
        await file.close();
    };
}
