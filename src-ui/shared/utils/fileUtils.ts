import { appDataDir } from "@tauri-apps/api/path";
import { exists, mkdir, open, OpenOptions } from "@tauri-apps/plugin-fs";

export class FileUtils {
    public static async ensureAppDataDir() {
        const dir = await appDataDir()
        const dirExists = await exists(dir.toString());
        if (!dirExists) {
            await mkdir(dir);
        }
    }
}
