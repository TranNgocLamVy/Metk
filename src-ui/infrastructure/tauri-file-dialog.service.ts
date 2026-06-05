import { open, save } from "@tauri-apps/plugin-dialog";

import { PathUtils } from "@/shared/utils/path.utils";
import { IFileDialogService, OpenFileDialogOptions, SaveFileDialogOptions } from "./interface/file-dialog.interface";

export class TauriFileDialogService implements IFileDialogService {
    public async open(options: OpenFileDialogOptions & { multiple: true }): Promise<string[] | null>;
    public async open(options?: OpenFileDialogOptions & { multiple?: false | undefined }): Promise<string | null>;
    public async open(options: OpenFileDialogOptions & { multiple: boolean }): Promise<string | string[] | null>;
    public async open(options: OpenFileDialogOptions & { multiple?: boolean } = {}): Promise<string | string[] | null> {
        const result = await open(options);
        if (result === null) return null;
        if (Array.isArray(result)) {
            return result.map((p) => PathUtils.normalize(p));
        }
        return PathUtils.normalize(result);
    }

    public async saveFile(options: SaveFileDialogOptions = {}): Promise<string | null> {
        const result = await save(options);
        if (!result) return null;
        return PathUtils.normalize(result);
    }
}
