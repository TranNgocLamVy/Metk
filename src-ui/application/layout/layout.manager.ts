import { PathUtils } from "@/shared/utils/path.utils";
import { Result } from "@/shared/types/result";
import { IJsonModel } from "flexlayout-react";
import { LayoutStorageService } from "@/infrastructure/container";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import EventEmitter from "eventemitter3";
import { Project } from "@/editor/model/project/project";
import {
    buildPanelRegistry,
    getKnownPanelIds,
    hydratePersistedLayoutModel,
    normalizePersistedLayoutModel,
    serializeLayoutModel,
} from "./layout-persistence";

interface LayoutManagerEvents {
    onLayoutLoaded: (layout: IJsonModel) => void;
    onLayoutUnloaded: () => void;
}

const LAYOUT_SAVE_DEBOUNCE_MS = 500;

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
        const panelRegistry = buildPanelRegistry(workspaceLayout);
        const knownPanelIds = getKnownPanelIds(panelRegistry);

        const layoutExist = await LayoutStorageService.exists(layoutAbsPath);
        if (!layoutExist) {
            this.layoutData = hydratePersistedLayoutModel(null, workspaceLayout, panelRegistry);
            await this.performSaveLayout();
        } else {
            const loadResult = await LayoutStorageService.load(layoutAbsPath);
            if (loadResult.status === Result.Status.Success) {
                const normalizedLayout = normalizePersistedLayoutModel(loadResult.data, knownPanelIds);
                this.layoutData = hydratePersistedLayoutModel(normalizedLayout, workspaceLayout, panelRegistry);
            } else {
                this.layoutData = hydratePersistedLayoutModel(null, workspaceLayout, panelRegistry);
                await this.performSaveLayout();
            }
        }
        if (!this.layoutData) this.layoutData = hydratePersistedLayoutModel(null, workspaceLayout, panelRegistry);
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
        }, LAYOUT_SAVE_DEBOUNCE_MS);
    }

    private async performSaveLayout(): Promise<Result> {
        if (!this.project || !this.layoutData) return Result.Cancel();

        const layoutAbsPath = this.project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "layout.json"));
        const panelRegistry = buildPanelRegistry(workspaceLayout);
        const knownPanelIds = getKnownPanelIds(panelRegistry);
        const serializedLayout = serializeLayoutModel(this.layoutData, { knownTabIds: knownPanelIds });
        const fallbackLayout = serializeLayoutModel(workspaceLayout, { knownTabIds: knownPanelIds });
        const normalizedLayout = normalizePersistedLayoutModel(serializedLayout, knownPanelIds)
            ?? normalizePersistedLayoutModel(fallbackLayout, knownPanelIds)
            ?? fallbackLayout;

        return await LayoutStorageService.save(layoutAbsPath, normalizedLayout);
    }

    public unloadLayout(): void {
        if (!this.project) return;
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.layoutData = null;
        this.project = null;
        this.emit("onLayoutUnloaded");
    }
}
