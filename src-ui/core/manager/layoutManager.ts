import { PathUtils } from "@/shared/utils/pathUtils";
import { Project } from "../application/project";
import { Result } from "@/shared/types/result";
import { IJsonModel } from "flexlayout-react";
import { LayoutStorageService } from "@/infrastructure/container";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import EventEmitter from "eventemitter3";

interface LayoutManagerEvents {
    onLayoutLoaded: (layout: IJsonModel) => void;
    onLayoutUnloaded: () => void;
}

export class LayoutManager extends EventEmitter<LayoutManagerEvents> {
    public layoutData: IJsonModel | null = null;
    private project: Project | null = null;
    private saveTimeout: NodeJS.Timeout | null = null;

    public constructor() {
        super();
    }

    public async loadLayout(project: Project): Promise<Result<IJsonModel>> {
        this.project = project;
        const layoutAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "layout.json"));

        const layoutExist = await LayoutStorageService.exists(layoutAbsPath);
        if (!layoutExist) {
            this.layoutData = workspaceLayout;
            await this.performSaveLayout();
        } else {
            const loadResult = await LayoutStorageService.load(layoutAbsPath);
            if (loadResult.status === Result.Status.Success) {
                this.layoutData = loadResult.data;
            } else {
                this.layoutData = workspaceLayout;
                await this.performSaveLayout();
            }
        }
        this.emit("onLayoutLoaded", this.layoutData);
        return Result.Success(this.layoutData);
    }

    public updateLayout(newLayout: IJsonModel): void {
        this.layoutData = newLayout;
        this.saveCurrentLayout();
    }

    private saveCurrentLayout(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.performSaveLayout();
        }, 500);
    }

    private async performSaveLayout(): Promise<Result> {
        if (!this.project || !this.layoutData) return Result.Cancel();

        const layoutAbsPath = this.project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "layout.json"));
        return await LayoutStorageService.save(layoutAbsPath, this.layoutData);
    }

    public unloadLayout(): void {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.layoutData = null;
        this.project = null;
        this.emit("onLayoutUnloaded");
    }
}