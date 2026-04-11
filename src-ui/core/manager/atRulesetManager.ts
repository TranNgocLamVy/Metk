import { ATRulesetMetadata } from "@/shared/schema/atRuleSchema";
import { ATRuleset } from "../application/atrule/atRuleset";
import { TilesetManager } from "./tilesetManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { ATRulesetStorageService } from "@/infrastructure/container";
import { TilesetRefManager } from "./tilesetRefManager";
import { ATRulesetRefManager } from "./atRulesetRefManager";



export class ATRulesetManager {
    public readonly atRulesetMetadata: Map<string, ATRulesetMetadata> = new Map<string, ATRulesetMetadata>(); // id -> atRuleMetadata
    private loadedAtRulesets: Map<string, ATRuleset> = new Map<string, ATRuleset>(); // id -> atRuleset

    private pendingLoads: Map<string, Promise<Result<ATRuleset>>> = new Map(); // atRuleId -> loadAtRule Promise

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public addAtRuleMetadata(atRuleMetadata: ATRulesetMetadata): void {
        this.atRulesetMetadata.set(atRuleMetadata.id, atRuleMetadata);
    }

    public loadATRulesetsMetadata(atRulesetsMetadata: ATRulesetMetadata[]): void {
        atRulesetsMetadata.forEach((meta) => this.atRulesetMetadata.set(meta.id, meta));
    }

    public removeAtRule(id: string): void {
        this.atRulesetMetadata.delete(id);
        this.loadedAtRulesets.delete(id);
        this.pendingLoads.delete(id);
    }

    public async loadAtRulesetsMetada(atRulesetsMetadata: ATRulesetMetadata[]): Promise<void> {
        atRulesetsMetadata.forEach((meta) => this.atRulesetMetadata.set(meta.id, meta));
    }

    public async loadAtRuleset(id: string): Promise<Result<ATRuleset>> {
        if (this.loadedAtRulesets.has(id)) return Result.Success(this.loadedAtRulesets.get(id)!)
        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performAtRulesetLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } catch (error) {
            return Promise.reject(error);
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performAtRulesetLoad(id: string): Promise<Result<ATRuleset>> {
        const metaData = this.atRulesetMetadata.get(id);
        if (!metaData) return Result.Error(`AT Ruleset metadata not found for id: ${id}`);

        const atRulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.atRulesetRelPath);
        const loadAtRulesetResult = await ATRulesetStorageService.load(atRulesetAbsPath);

        if (loadAtRulesetResult.status !== Result.Status.Success) {
            // TODO: Move ToastService outside of ATRuleManager
            ToastService.error({ message: loadAtRulesetResult.message });
            return Result.Error(loadAtRulesetResult.message);
        }

        const atRulesetData = loadAtRulesetResult.data;

        const atRulesetPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.atRulesetRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, atRulesetPathSystem);
        const atRulesetRefManager = new ATRulesetRefManager(this, atRulesetPathSystem);
        const atRuleset = new ATRuleset(atRulesetData, atRulesetPathSystem, tilesetRefManager, atRulesetRefManager);

        await atRuleset.load();

        this.loadedAtRulesets.set(atRulesetData.id, atRuleset);

        let addMoreTileset: boolean = false;
        await Promise.all(atRulesetData.tilesets.map(tilesetRef => {
            if (this.tilesetManager.tilesetMetadata.has(tilesetRef.id)) {
                return this.tilesetManager.loadTileset({ id: tilesetRef.id })
            } else {
                addMoreTileset = true;
                const tilesetAbsPath = atRulesetPathSystem.getAbsPathFromRelPath(tilesetRef.source);
                const tilesetRelPathFromProject = this.projectPathSystem.getRelPathFromAbsPath(tilesetAbsPath);
                return this.tilesetManager.loadTileset({ tilesetRelPath: tilesetRelPathFromProject });
            }
        }));

        return Result.Success(atRuleset);
    }

    public async unloadAtRuleset(id: string): Promise<void> {
        const atRulesetMetadata = this.atRulesetMetadata.get(id);
        if (!atRulesetMetadata) return;

        const atRuleset = this.loadedAtRulesets.get(id);
        if (!atRuleset) return;

        this.loadedAtRulesets.delete(id);
    }

    public async saveAtRuleset(id: string): Promise<Result> {
        const atRuleset = this.loadedAtRulesets.get(id);
        if (atRuleset == undefined) return Result.Error("AT Ruleset not found");

        const atRulesetData = atRuleset.serialize();
        return ATRulesetStorageService.save(atRuleset.atRulesetPathSystem.getFileAbsDir(), atRulesetData);
    }

    public getAtRulesetById(id: string): ATRuleset | null {
        const atRuleset = this.loadedAtRulesets.get(id);
        if (atRuleset === undefined) return null
        return atRuleset;
    }

    public getAtRulesetMetadataById(id: string): ATRulesetMetadata | null {
        const atRulesetMetadata = this.atRulesetMetadata.get(id);
        if (!atRulesetMetadata) return null;
        return atRulesetMetadata;
    }

    public getAtRulesetAbsById(id: string): string | null {
        const atRulesetMetadata = this.atRulesetMetadata.get(id);
        if (!atRulesetMetadata) return null;

        return this.projectPathSystem.getAbsPathFromRelPath(atRulesetMetadata.atRulesetRelPath);
    }

    public cloneAtRuleset(id: string): ATRuleset | null {
        const atRuleset = this.loadedAtRulesets.get(id);
        if (!atRuleset) return null;
        const atRulesetData = atRuleset.serialize();
        const atRulesetPathSystem = new FilePathSystem(atRulesetData.id, this.projectPathSystem, atRuleset.atRulesetPathSystem.relPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, atRulesetPathSystem);
        const atRulesetRefManager = new ATRulesetRefManager(this, atRulesetPathSystem);
        return new ATRuleset(atRulesetData, atRulesetPathSystem, tilesetRefManager, atRulesetRefManager);
    }

    public serialize(): ATRulesetMetadata[] {
        return Array.from(this.atRulesetMetadata.values()).map((metaData) => {
            const atRulesets = this.loadedAtRulesets.get(metaData.id);
            if (!atRulesets) return metaData;
            return {  id: atRulesets.id, name: atRulesets.name, color: atRulesets.color, atRulesetRelPath: atRulesets.atRulesetPathSystem.relPath };
        });
    }
}