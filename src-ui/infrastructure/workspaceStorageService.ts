import { type } from "arktype";

import { WorkpsaceData, WorkspaceRepoSchema } from "@/shared/schema/workspaceSchema";
import { Result } from "@/shared/types/result";
import { JsonFormatter } from "@/shared/utils/jsonFormatter";
import { PathUtils } from "@/shared/utils/pathUtils";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

import { IWorkspacetorageService } from "./interface/IWorkspaceStorageService";

export class JsonWorkspaceStorageService implements IWorkspacetorageService {
    constructor(public projectDir: string) { }
    public async loadWorkspace(): Promise<Result<WorkpsaceData>> {
        const workspaceAbsPath = PathUtils.join(this.projectDir, "session.ss.json");
        const exist = await exists(workspaceAbsPath);
        if (!exist) return { status: "Error", message: "Session file not found" };
        const workspaceFileData = await readTextFile(workspaceAbsPath);
        if (!workspaceFileData) return { status: "Error", message: "Failed to read session file" };
        const workspaceData = WorkspaceRepoSchema(workspaceFileData);
        if (workspaceData instanceof type.errors) {
            console.error(workspaceData.summary);
            return { status: "Error", message: "Failed to parse session file" };
        }
        return { status: "Success", data: workspaceData };
    }

    public async saveWorkspace(content: any): Promise<Result> {
        const workspaceAbsPath = PathUtils.join(this.projectDir, "session.ss.json");
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