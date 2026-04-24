import { PathUtils } from "@/shared/utils/pathUtils";
import { Project } from "../application/project";
import { Result } from "@/shared/types/result";
import { IJsonModel } from "flexlayout-react";
import { LayoutStorageService } from "@/infrastructure/container";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";

export class LayoutManager {
    public layoutData: IJsonModel | null = null;
    private project: Project | null = null;
    private saveTimeout: NodeJS.Timeout | null = null;

    public constructor() { }

    public async loadLayout(project: Project): Promise<Result<IJsonModel>> {
        this.project = project;
        const layoutAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "layout.json"));

        const loadResult = await LayoutStorageService.load(layoutAbsPath);

        if (loadResult.status === Result.Status.Success) {
            this.layoutData = loadResult.data;
        } else {
            this.layoutData = workspaceLayout;
        }

        return Result.Success(this.layoutData);
    }

    public updateLayout(newLayout: IJsonModel): void {
        this.layoutData = newLayout;
        this.saveLayout();
    }

    private saveLayout(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.performSave();
        }, 500);
    }

    private async performSave(): Promise<Result> {
        if (!this.project || !this.layoutData) return Result.Cancel();

        const layoutAbsPath = this.project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "layout.json"));
        return await LayoutStorageService.save(layoutAbsPath, this.layoutData);
    }

    public unloadLayout(): void {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.layoutData = null;
        this.project = null;
    }
}