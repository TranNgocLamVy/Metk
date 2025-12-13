import { Result } from "@/shared/types/result";

export interface IWorkspacetorageService {
    projectDir: string;
    loadWorkspace(): Promise<Result<any>>;
    saveWorkspace(content: any): Promise<Result>;
}