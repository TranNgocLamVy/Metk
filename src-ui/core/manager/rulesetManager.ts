import { RulesetData, RulesetMetadata } from "@/shared/schema/rulesetSchema";
import { Ruleset } from "../application/rule/ruleset";
import { TilesetManager } from "./tilesetManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { Result } from "@/shared/types/result";
import { RulesetStorageService } from "@/infrastructure/container";
import { TilesetRefManager } from "./tilesetRefManager";
import { RulesetRefManager } from "./rulesetRefManager";


export class RulesetManager {
    public readonly rulesetMetadatas: Map<string, RulesetMetadata> = new Map<string, RulesetMetadata>(); // id -> ruleMetadata
    private loadedRulesets: Map<string, Ruleset> = new Map<string, Ruleset>(); // id -> ruleset

    private pendingLoads: Map<string, Promise<Result<Ruleset>>> = new Map(); // ruleId -> loadRule Promise

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public getRulesetById(id: string): Ruleset | null {
        const ruleset = this.loadedRulesets.get(id);
        if (ruleset === undefined) return null
        return ruleset;
    }

    public async getRuleset(id: string): Promise<Ruleset | null> {
        const rulesetMetadata = this.getRulesetMetadataById(id);
        if (!rulesetMetadata) return null;
        const loadResult = await this.loadRuleset(id);
        if (loadResult.status !== Result.Status.Success) return null;
        return loadResult.data;
    }

    public getRulesetMetadataById(id: string): RulesetMetadata | null {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) return null;
        return rulesetMetadata;
    }

    public addRuleMetadata(ruleMetadata: RulesetMetadata): void {
        this.rulesetMetadatas.set(ruleMetadata.id, ruleMetadata);
    }

    public setRulesetMetadatas(rulesetsMetadata: RulesetMetadata[]): void {
        rulesetsMetadata.forEach((meta) => this.rulesetMetadatas.set(meta.id, meta));
    }

    public async loadRuleset(id: string): Promise<Result<Ruleset>> {
        if (this.loadedRulesets.has(id)) return Result.Success(this.loadedRulesets.get(id)!)
        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;
        if (!this.rulesetMetadatas.has(id)) return Result.Error(`Ruleset metadata not found for id: ${id}`);
        const loadPromise = this.performRulesetLoad(id);
        this.pendingLoads.set(id, loadPromise);
        try {
            return await loadPromise;
        } catch (error) {
            return Result.Error(`Failed to load ruleset, error: ${error}`);
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performRulesetLoad(id: string): Promise<Result<Ruleset>> {
        const metaData = this.rulesetMetadatas.get(id)!;

        const rulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.rulesetRelPath);
        const loadRulesetResult = await RulesetStorageService.load(rulesetAbsPath);

        if (loadRulesetResult.status !== Result.Status.Success)  return Result.Error(loadRulesetResult.message);

        const rulesetData = loadRulesetResult.data;

        const rulesetPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.rulesetRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, rulesetPathSystem);
        tilesetRefManager.load(rulesetData.tilesets.refs, rulesetData.tilesets.nextIndex);
        const rulesetRefManager = new RulesetRefManager(this, rulesetPathSystem);
        rulesetRefManager.load(rulesetData.rulesets.refs, rulesetData.rulesets.nextIndex);
        const ruleset = new Ruleset(rulesetData, rulesetPathSystem, tilesetRefManager, rulesetRefManager);

        await ruleset.load();

        this.loadedRulesets.set(rulesetData.id, ruleset);

        await Promise.all(rulesetData.tilesets.refs.map(tilesetRef => {
            if (this.tilesetManager.tilesetMetadata.has(tilesetRef.id)) {
                return this.tilesetManager.loadTileset({ id: tilesetRef.id })
            }
            // TODO: Handle unknown tileset
        }));

        await Promise.all(rulesetData.rulesets.refs.map(rulesetRef => {
            if (this.rulesetMetadatas.has(rulesetRef.id)) {
                return this.loadRuleset(rulesetRef.id)
            }
            // TODO: Handle unknown ruleset
        }));

        return Result.Success(ruleset);
    }

    public async unloadRuleset(id: string): Promise<void> {
        const ruleset = this.loadedRulesets.get(id);
        if (!ruleset) return;
        await ruleset.unload();
        this.loadedRulesets.delete(id);
    }

    public async saveRuleset(id: string): Promise<Result> {
        const ruleset = this.loadedRulesets.get(id);
        if (ruleset == undefined) return Result.Error("Ruleset not found");
        const rulesetData = ruleset.serialize();
        return RulesetStorageService.save(ruleset.rulesetPathSystem.getFileAbsPath(), rulesetData);
    }

    public updateRuleset(rulesetData: RulesetData): void {
        const ruleset = this.loadedRulesets.get(rulesetData.id);
        if (!ruleset) return;
        ruleset.updateRuleset(rulesetData);
    }

    public async deleteRuleset(id: string): Promise<Result> {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) return Result.Error(`Ruleset metadata not found for id: ${id}`);
    
        if (this.loadedRulesets.has(id)) await this.unloadRuleset(id);
    
        const rulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(rulesetMetadata.rulesetRelPath);
        const removeResult = await RulesetStorageService.remove(rulesetAbsPath);
        
        if (removeResult.status !== Result.Status.Success) {
            return Result.Error(`Failed to delete ruleset file: ${removeResult.message}`);
        }
        this.rulesetMetadatas.delete(id);
        this.loadedRulesets.delete(id);
        this.pendingLoads.delete(id);
        return Result.Success();
    }

    public cloneRuleset(id: string): Ruleset | null {
        const ruleset = this.loadedRulesets.get(id);
        if (!ruleset) return null;
        const rulesetData = ruleset.serialize();
        const rulesetPathSystem = new FilePathSystem(rulesetData.id, this.projectPathSystem, ruleset.rulesetPathSystem.relPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, rulesetPathSystem);
        const rulesetRefManager = new RulesetRefManager(this, rulesetPathSystem);
        return new Ruleset(rulesetData, rulesetPathSystem, tilesetRefManager, rulesetRefManager);
    }

    public serialize(): RulesetMetadata[] {
        return Array.from(this.rulesetMetadatas.values()).map((metaData) => {
            const rulesets = this.loadedRulesets.get(metaData.id);
            if (!rulesets) return metaData;
            return { id: rulesets.id, name: rulesets.name, color: rulesets.color, rulesetRelPath: rulesets.rulesetPathSystem.relPath };
        });
    }
}