import { Result } from "@/shared/types/result";
import { create, exists, writeFile } from "@tauri-apps/plugin-fs";

export class ExportStorageService {
    public async exportToPath(filePath: string, buffer: Uint8Array<ArrayBuffer>): Promise<Result> {
        const exist = await exists(filePath);
        if (exist) {
            await writeFile(filePath, buffer);
        } else {
            const file = await create(filePath);
            await file.write(buffer);
            await file.close();
        }
        return Result.Success()
    }
}