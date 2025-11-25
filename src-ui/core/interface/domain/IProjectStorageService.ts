

export interface IProjectStorageService {
    loadProject(filePath: string): Promise<any>;
    saveProject(filePath: string, content: any): Promise<void>;
}