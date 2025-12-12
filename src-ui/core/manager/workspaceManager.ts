import { IWorkspacetorageService } from "@/infrastructure/interface/IWorkspaceStorageService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { Project } from "../application/project";
import { Workspace } from "../application/workspace";

export class WorkspaceManager {
    private projectWorkspaceAbsPath: string | null = null;
    public currentWorkspace: Workspace | null = null;
    public constructor(
        private readonly workspaceStorageService: IWorkspacetorageService
    ) { }

    public async save(): Promise<Result> {


        return { status: "Success", data: null };
    }

    public async loadProjectWorkspace(project: Project): Promise<Result> {
        const projectWorkspaceAbsPath = PathUtils.join(project.metaData.directory, "session.ss.json");
        const loadSessionResult = await this.workspaceStorageService.loadWorkspace(projectWorkspaceAbsPath);
        if (loadSessionResult.status === "Success") {
            this.projectWorkspaceAbsPath = projectWorkspaceAbsPath;
        } else {

        }
        this.currentWorkspace = new Workspace(loadSessionResult.data);
        return { status: "Success", data: null };
    }
    private serialize(): any {

    }
    
    public async saveCurrentWorpsace(): Promise<Result> {
        if (!this.projectWorkspaceAbsPath) return { status: "Error", message: "No session is currently loaded" };
        const saveSessionResult = await this.workspaceStorageService.saveWorkspace(this.projectWorkspaceAbsPath, this.serialize());
        return saveSessionResult
    }
}