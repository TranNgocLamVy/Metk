import { open, OpenDialogOptions, save, SaveDialogOptions } from "@tauri-apps/plugin-dialog";

import { PathUtils } from "./path.utils";

export class FileDialogUtils {
    public static async open(options: OpenDialogOptions & { multiple: true }): Promise<string[] | null>;
    public static async open(options?: OpenDialogOptions & { multiple?: false | undefined }): Promise<string | null>;
    public static async open(options: OpenDialogOptions & { multiple: boolean }): Promise<string | string[] | null>;
    public static async open(options: OpenDialogOptions & { multiple?: boolean } = {}): Promise<string | string[] | null> {
        const result = await open(options);
        if (result === null) return null;
        if (Array.isArray(result)) {
            return result.map((p) => PathUtils.normalize(p));
        }
        return PathUtils.normalize(result);
    }

    public static async saveFile(options: SaveDialogOptions = {}): Promise<string | null> {
        const result = await save(options);
        if (!result) return null;
        return PathUtils.normalize(result);
    }
}