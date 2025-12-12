import { Result } from "@/shared/types/result";
import { JsonFormatter } from "@/shared/utils/jsonFormatter";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

import { IWorkspacetorageService } from "./interface/IWorkspaceStorageService";

export class JsonWorkspaceStorageService implements IWorkspacetorageService {
    public async loadWorkspace(workspaceAbsPath: string): Promise<Result> {
        const exist = await exists(workspaceAbsPath);
        if (!exist) return { status: "Error", message: "Session file not found" };
        const sessionFileData = await readTextFile(workspaceAbsPath);
        if (!sessionFileData) return { status: "Error", message: "Failed to read session file" };
        const sessionData = JSON.parse(sessionFileData);
        return { status: "Success", data: sessionData };

        // TODO: parse session file
        // const sessionData = SessionDataSchema(sessionFileData);
        // if (sessionData instanceof type.errors) {
        //     console.error(sessionData.summary);
        //     return { status: "Error", message: "Failed to parse session file" };
        // }
        // return { status: "Success", data: sessionData };
    }

    public async saveWorkspace(workspaceAbsPath: string, content: any): Promise<Result> {
        const exist = await exists(workspaceAbsPath);
        const stringContent = JsonFormatter.format(content);
        if (!stringContent) return { status: "Error", message: "Error while formatting json" };
        if (exist) {
            await writeTextFile(workspaceAbsPath, stringContent);
        } else {
            const file = await create(workspaceAbsPath);
            await file.write(new TextEncoder().encode(stringContent));
            await file.close();
        }
        return { status: "Success", data: null };
    }
}