import { RulesetData, RulesetMetadata } from "@/shared/schema/rulesetSchema";
import { Ruleset } from "../application/rule/ruleset";
import { TilesetManager } from "./tilesetManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { Result } from "@/shared/types/result";
import { RulesetStorageService } from "@/infrastructure/container";
import { TilesetRefManager } from "./tilesetRefManager";
import { RulesetRefManager } from "./rulesetRefManager";
import { PathUtils } from "@/shared/utils/pathUtils";
import { Console } from "@/shared/services/consoleService";
import { RulesetService } from "@/shared/services/rulesetService";


export class RulesetManager {
    public readonly rulesetMetadatas: Map<string, RulesetMetadata> = new Map<string, RulesetMetadata>(); // id -> ruleMetadata
    private loadedRulesets: Map<string, Ruleset> = new Map<string, Ruleset>(); // id -> ruleset

    private pendingLoads: Map<string, Promise<Result<Ruleset>>> = new Map(); // ruleId -> loadRule Promise

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public addRulesetMetadata(ruleMetadata: RulesetMetadata): void {
        this.rulesetMetadatas.set(ruleMetadata.id, ruleMetadata);
    }

    public async addRuleset(ruleset: RulesetData, rulesetAbsPath: string): Promise<void> {
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

        await this.loadRulesetDependencies(ruleset);
    }

    public loadRulesetMetadata(rulesetsMetadata: RulesetMetadata[]): void {
        rulesetsMetadata.forEach((meta) => this.rulesetMetadatas.set(meta.id, meta));
    }

    public async loadRulesets(ids: string[]): Promise<void> {
        await Promise.all(ids.map(id => this.loadRuleset(id)));
    }

    public async loadRuleset(id: string): Promise<Result<Ruleset>> {
        if (this.loadedRulesets.has(id)) return Result.Success(this.loadedRulesets.get(id)!)
        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performRulesetLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } catch (error) {
            console.error("Unknown error: ", error);
            return Result.Error("message.ruleset.unknownError");
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performRulesetLoad(id: string): Promise<Result<Ruleset>> {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) {
            const customId = "loadRulesetFail" + id;
            Console.error({
                message: { key: "message.ruleset.loadFail", options: { name: "Unknow", id } },
                stacks: ["message.ruleset.metadataNotFound"],
                actions: [{ label: "global.action.ruleset.import", onClick: () => RulesetService.importRuleset(id), variant: "outline" }]
            }, customId);
            return Result.Error("message.ruleset.metadataNotFound");
        }

        const rulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(rulesetMetadata.rulesetRelPath);
        const loadRulesetResult = await RulesetStorageService.load(rulesetAbsPath);

        if (loadRulesetResult.status !== Result.Status.Success) {
            const customId = "loadRulesetFail" + id;
            Console.error({
                message: { key: "message.ruleset.loadFail", options: { name: rulesetMetadata.name, id } },
                stacks: loadRulesetResult.message ? [loadRulesetResult.message] : [],
                actions: [
                    { label: "global.action.ruleset.import", onClick: () => RulesetService.importRuleset(id), variant: "outline" },
                    { label: "global.action.ruleset.remove", onClick: () => RulesetService.removeRuleset(id), variant: "destructive" },
                ]
            }, customId);
            return Result.Error(loadRulesetResult.message);
        }

        const rulesetData = loadRulesetResult.data;

        const rulesetPathSystem = new FilePathSystem(rulesetMetadata.id, this.projectPathSystem, rulesetMetadata.rulesetRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, rulesetPathSystem);
        const rulesetRefManager = new RulesetRefManager(this, rulesetPathSystem);
        const ruleset = new Ruleset(rulesetData, rulesetPathSystem, tilesetRefManager, rulesetRefManager);

        await ruleset.load();

        this.loadedRulesets.set(rulesetData.id, ruleset);

        await this.loadRulesetDependencies(rulesetData);

        return Result.Success(ruleset);
    }

    private async loadRulesetDependencies(rulesetData: RulesetData): Promise<void> {
        await Promise.all(rulesetData.tilesets.refs.map(tilesetRef => {
            if (this.tilesetManager.tilesetMetadata.has(tilesetRef.id)) {
                return this.tilesetManager.loadTileset({ id: tilesetRef.id })
            }
        }));

        await this.loadRulesets(rulesetData.rulesets.refs.map(rulesetRef => rulesetRef.id).filter(id => id !== rulesetData.id));
    }

    public async unloadRuleset(id: string): Promise<void> {
        const ruleset = this.loadedRulesets.get(id);
        if (!ruleset) return;
        await ruleset.unload();
        this.loadedRulesets.delete(id);
    }

    public async saveRuleset(id: string): Promise<Result> {
        const ruleset = this.loadedRulesets.get(id);
        if (ruleset == undefined) return Result.Error({ key: "message.ruleset.notFound", options: { id }});
        const rulesetData = ruleset.serialize();
        return RulesetStorageService.save(ruleset.rulesetPathSystem.getFileAbsPath(), rulesetData);
    }

    public async removeRulesetMetadata(id: string): Promise<Result> {
        const metaData = this.rulesetMetadatas.get(id);
        if (!metaData) return Result.Error({ key: "message.ruleset.metadataNotFound", options: { id }});

        if (this.loadedRulesets.has(id)) {
            await this.unloadRuleset(id);
        }

        this.rulesetMetadatas.delete(id);
        Console.log({ message: { key: "message.ruleset.removeSuccess" , options: { name: metaData.name }}});
        return Result.Success();
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
        Console.success({ message: { key: "message.ruleset.updatedSuccess" , options: { name: rulesetData.name }}})
    }

    public async deleteRuleset(id: string): Promise<Result> {
        const rulesetMetadata = this.rulesetMetadatas.get(id);
        if (!rulesetMetadata) {
            Console.error({
                message: "message.ruleset.deleteFail",
                stacks: ["message.ruleset.metadataNotFound"],
            })
            return Result.Error({ key: "message.ruleset.metadataNotFound", options: { id }});
        }

        if (this.loadedRulesets.has(id)) await this.unloadRuleset(id);

        const rulesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(rulesetMetadata.rulesetRelPath);
        const removeResult = await RulesetStorageService.remove(rulesetAbsPath);

        if (removeResult.status !== Result.Status.Success) {
            Console.error({ message: "message.ruleset.deleteFail", stacks: [removeResult.message!, ...removeResult.stacks!]})
            return Result.Error("message.ruleset.deleteFail", removeResult);
        }
        this.rulesetMetadatas.delete(id);
        this.loadedRulesets.delete(id);
        this.pendingLoads.delete(id);
        Console.log({ message: { key: "message.ruleset.deleteSuccess", options: { name: rulesetMetadata.name }}});
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