import { Result } from "@/shared/types/result";

export interface IWorkspacetorageService {
    loadWorkspace(workspaceAbsPath: string): Promise<Result<any>>;
    saveWorkspace(workspaceAbsPath: string, content: any): Promise<Result>;
}