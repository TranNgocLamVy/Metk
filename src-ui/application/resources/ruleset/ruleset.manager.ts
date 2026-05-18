import { RulesetData, RulesetMetadata } from "@/shared/schema/ruleset.schema";
import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { TilesetManager } from "../tileset/tileset.manager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { Result } from "@/shared/types/result";
import { RulesetStorageService } from "@/infrastructure/container";
import { TilesetRefManager } from "../references/tileset-ref.manager";
import { RulesetRefManager } from "../references/ruleset-ref.manager";
import { PathUtils } from "@/shared/utils/path.utils";
import { Console } from "@/shared/services/console.service";
import EventEmitter from "eventemitter3";
import { CatchError } from "@/shared/decorator/catch-result-error.decorator";

export interface RulesetManagerEvent {
    onRulesetManagerUpdated: (rulesets: RulesetMetadata[]) => void;
    onRulesetUpdated: (rulesetId: string) => void;
}

export class RulesetManager extends EventEmitter<RulesetManagerEvent> {
    public readonly rulesetMetadatas: Map<string, RulesetMetadata> = new Map<string, RulesetMetadata>(); // id -> ruleMetadata
    private loadedRulesets: Map<string, Ruleset> = new Map<string, Ruleset>(); // id -> ruleset

    private pendingLoads: Map<string, Promise<Result<Ruleset>>> = new Map(); // ruleId -> loadRule Promise

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) {
        super();
    }

    public addRulesetMetadata(ruleMetadata: RulesetMetadata): void {
        this.rulesetMetadatas.set(ruleMetadata.id, ruleMetadata);
    }

    public async addRuleset(ruleset: RulesetData, rulesetAbsPath: string): Promise<Result<Ruleset>> {
        const rulesetRelPath = PathUtils.relative(this.projectPathSystem.absDir, rulesetAbsPath);
        const rulesetMetadata: RulesetMetadata = {
            id: ruleset.id,
            name: ruleset.name,
            color: ruleset.color,
            rulesetRelPath: rulesetRelPath,
        }
        this.rulesetMetadatas.set(ruleset.id, rulesetMetadata);
        const rulesetPathSystem = new FilePathSystem(ruleset.id, this.projectPathSystem, rulesetRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, rulesetPathSystem);
        const rulesetRefManager = new RulesetRefManager(this, rulesetPathSystem);
        const newRuleset = new Ruleset(ruleset, rulesetPathSystem, tilesetRefManager, rulesetRefManager);

        await newRuleset.load();

        this.loadedRulesets.set(ruleset.id, newRuleset);

        const tilesetDepIds = ruleset.tilesets.refs.map(tilesetRef => tilesetRef.id);
        const rulesetDepIds = ruleset.rulesets.refs.map(rulesetRef => rulesetRef.id).filter(id => id !== ruleset.id && !this.pendingLoads.has(id));
        await Promise.all([
            this.tilesetManager.loadTilesets(tilesetDepIds),
            this.loadRulesets(rulesetDepIds),
        ])

        this.emit("onRulesetManagerUpdated", this.serialize());

        return Result.Success(newRuleset);
    }

    public loadRulesetMetadata(rulesetsMetadata: RulesetMetadata[]): void {
        rulesetsMetadata.forEach((meta) => this.rulesetMetadatas.set(meta.id, meta));
    }

    public async loadRulesets(ids: string[]): Promise<Result<Ruleset>[]> {
        return await Promise.all(ids.map(id => this.loadRuleset(id)));
    }

    @CatchError("message.system.unknownError.loadRuleset")
    public async loadRuleset(id: string): Promise<Result<Ruleset>> {
        if (this.loadedRulesets.has(id)) return Result.Success(this.loadedRulesets.get(id)!)
        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performRulesetLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {   
            return await loadPromise;
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performRulesetLoad(id: string): Promise<Result<Ruleset>> {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) {
            const customId = "loadRulesetFail:" + id;
            Console.error({
                message: { key: "message.ruleset.loadFail", options: { name: "Unknow", id } },
                stacks: ["message.ruleset.metadataNotFound"],
                actions: [{
                    label: "global.action.ruleset.import", variant: "outline",
                    onClick: async () => {
                        const { RulesetService } = await import("@/shared/services/ruleset.service");
                        return await RulesetService.importRuleset(id);
                    }
                }]
            }, customId);
            return Result.Error("message.ruleset.metadataNotFound");
        }

        const rulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(rulesetMetadata.rulesetRelPath);
        const loadRulesetResult = await RulesetStorageService.load(rulesetAbsPath);

        if (loadRulesetResult.status !== Result.Status.Success) {
            const customId = "loadRulesetFail:" + id;
            Console.error({
                message: { key: "message.ruleset.loadFail", options: { name: rulesetMetadata.name, id } },
                stacks: loadRulesetResult.message ? [loadRulesetResult.message] : [],
                actions: [
                    {
                        label: "global.action.ruleset.import", variant: "outline",
                        onClick: async () => {
                            const { RulesetService } = await import("@/shared/services/ruleset.service");
                            return await RulesetService.importRuleset(id);
                        }
                    },
                    {
                        label: "global.action.ruleset.remove", variant: "destructive",
                        onClick: async () => {
                            const { RulesetService } = await import("@/shared/services/ruleset.service");
                            return await RulesetService.removeRuleset(id);
                        }
                    },
                ]
            }, customId);
            return Result.Error(loadRulesetResult.message);
        }

        return await this.addRuleset(loadRulesetResult.data, rulesetAbsPath);
    }

    public async unloadRuleset(id: string): Promise<void> {
        const ruleset = this.loadedRulesets.get(id);
        if (!ruleset) return;
        await ruleset.unload();
        this.loadedRulesets.delete(id);
    }

    public async saveRuleset(id: string): Promise<Result> {
        const ruleset = this.loadedRulesets.get(id);
        if (ruleset == undefined) return Result.Error({ key: "message.ruleset.notFound", options: { id } });
        const rulesetData = ruleset.serialize();
        return RulesetStorageService.save(ruleset.rulesetPathSystem.getFileAbsPath(), rulesetData);
    }

    public getRulesetById(id: string): Ruleset | null {
        const ruleset = this.loadedRulesets.get(id);
        if (ruleset === undefined) return null
        return ruleset;
    }

    public getRulesetMetadataById(id: string): RulesetMetadata | null {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) return null;
        return rulesetMetadata;
    }

    public updateRuleset(rulesetData: RulesetData): void {
        const ruleset = this.loadedRulesets.get(rulesetData.id);
        if (!ruleset) return;
        ruleset.updateRuleset(rulesetData);
        this.emit("onRulesetManagerUpdated", this.serialize());
        this.emit("onRulesetUpdated", rulesetData.id);
        Console.success({ message: { key: "message.ruleset.updatedSuccess", options: { name: rulesetData.name } } })
    }

    public async removeRuleset(id: string): Promise<Result> {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) return Result.Error({ key: "message.ruleset.metadataNotFound", options: { id } });

        if (this.loadedRulesets.has(id)) await this.unloadRuleset(id);

        this.rulesetMetadatas.delete(id);
        this.loadedRulesets.delete(id);
        this.pendingLoads.delete(id);

        Console.log({ message: { key: "message.ruleset.removeSuccess", options: { name: rulesetMetadata.name } } });

        this.emit("onRulesetManagerUpdated", this.serialize());

        return Result.Success();
    }

    public async deleteRuleset(id: string): Promise<Result> {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) {
            Console.error({
                message: "message.ruleset.deleteFail",
                stacks: ["message.ruleset.metadataNotFound"],
            })
            return Result.Error({ key: "message.ruleset.metadataNotFound", options: { id } });
        }

        if (this.loadedRulesets.has(id)) await this.unloadRuleset(id);

        const rulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(rulesetMetadata.rulesetRelPath);

        const deletionResult = await RulesetStorageService.remove(rulesetAbsPath);
        if (deletionResult.status !== Result.Status.Success) {
            Console.error({ message: "message.ruleset.deleteFail", stacks: [deletionResult.message!, ...deletionResult.stacks!] })
            return Result.Error("message.ruleset.deleteFail", deletionResult);
        }

        this.rulesetMetadatas.delete(id);
        this.loadedRulesets.delete(id);
        this.pendingLoads.delete(id);

        Console.log({ message: { key: "message.ruleset.deleteSuccess", options: { name: rulesetMetadata.name } } });

        this.emit("onRulesetManagerUpdated", this.serialize());
        
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

    public async removeTilesetRef(tilesetId: string) {
        for (const ruleset of this.loadedRulesets.values()) {
            const result = ruleset.removeTilesetRef(tilesetId);
            if (result) await this.saveRuleset(ruleset.id);
        }
    }

    public async removeRulesetRef(rulesetId: string) {
        for (const ruleset of this.loadedRulesets.values()) {
            const result = ruleset.removeRulesetRef(rulesetId);
            if (result) await this.saveRuleset(ruleset.id);
        }
    }

    public serialize(): RulesetMetadata[] {
        return Array.from(this.rulesetMetadatas.values()).map((metaData) => {
            const rulesets = this.loadedRulesets.get(metaData.id);
            if (!rulesets) return metaData;
            return { id: rulesets.id, name: rulesets.name, color: rulesets.color, rulesetRelPath: rulesets.rulesetPathSystem.relPath };
        });
    }
}