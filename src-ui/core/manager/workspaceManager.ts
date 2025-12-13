import { IWorkspacetorageService } from "@/infrastructure/interface/IWorkspaceStorageService";
import { WorkpsaceData } from "@/shared/schema/workspace";
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
            this.currentWorkspace = new Workspace(loadSessionResult.data, project.tilesetManager);
        } else {
            const defaultWorkspaceData: WorkpsaceData = {
                tilesets: {
                    tilesetSessions: [],
                    currentTilesetSessionId: null,
                }
            }
            const bla = {
                "tilesets": {
                    "tilesetSessions": [
                        {
                            "id": "b683b8ff-7959-4741-aa58-de78775cab99",
                            "tilesetId": "49061471-2ce7-4baf-aa59-a86e413d02d5",
                            "viewState": {
                                "x": 256,
                                "y": 256,
                                "zoom": 1.5
                            }
                        },
                        {
                            "id": "9449bb81-d47b-492b-9571-c98d82a2bfaf",
                            "tilesetId": "6bb0a03a-e474-4227-9b5a-aab945cbfd39",
                            "viewState": {
                                "x": 249.7223231150914,
                                "y": 173.449688279857,
                                "zoom": 0.6997747436526052
                            }
                        }
                    ],
                    "currentTilesetSessionId": "9449bb81-d47b-492b-9571-c98d82a2bfaf"
                }
            }
            this.currentWorkspace = new Workspace(defaultWorkspaceData, project.tilesetManager); 
        }
        await this.currentWorkspace.load();
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