import { RulesetMetadata, RulesetRefData } from "@/shared/schema/rulesetSchema";
import { RulesetManager } from "./rulesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { PathUtils } from "@/shared/utils/pathUtils";



export class RulesetRefManager {
    public rulesetRefs: RulesetRefData[] = []
    private nextIndex: number;

    constructor(
        public readonly rulesetManager: RulesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(rulesetRefs: RulesetRefData[], nextIndex: number) {
        this.rulesetRefs = rulesetRefs;
        this.nextIndex = nextIndex;
    }

    public getRulesetIndex(ruleset: RulesetMetadata): number {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.id === ruleset.id);
        if (!rulesetRef) {
            const rulesetAbsPath = this.rulesetManager.getRulesetAbsById(ruleset.id);
            if (!rulesetAbsPath) return -1;

            const absDir = this.filePathSystem.getFileAbsDir();
        
            const rulesetRelPath = PathUtils.relative(absDir, rulesetAbsPath);

            const newRulesetRef: RulesetRefData = {
                index: this.nextIndex,
                id: ruleset.id,
                name: ruleset.name,
                source: rulesetRelPath,
            }
            this.rulesetRefs.push(newRulesetRef);
            this.nextIndex += 1;
            return newRulesetRef.index;
        }
        return rulesetRef.index;
    }

    public getRulesetIndexById(rulesetId: string): number {
        const rulesetMetadata = this.rulesetManager.getRulesetMetadataById(rulesetId);
        if (!rulesetMetadata) return -1;
        return this.getRulesetIndex(rulesetMetadata);
    }

    public getRulesetIdByIndex(index: number): string | null {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.index === index);
        if (!rulesetRef) return null;
        return rulesetRef.id;
    }

    public getRefIds(): string[] {
        const ids = this.rulesetRefs.map(ref => ref.id);
        return ids;
    }

    public serialize() {
        return {
            refs: Array.from(this.rulesetRefs),
            nextIndex: this.nextIndex,
        }
    }
}