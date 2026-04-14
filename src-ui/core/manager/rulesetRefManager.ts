import { RulesetMetadata, RulesetRefData } from "@/shared/schema/ruleSchema";
import { RulesetManager } from "./rulesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { PathUtils } from "@/shared/utils/pathUtils";



export class RulesetRefManager {
    public rulesetRefs: RulesetRefData[] = []
    private nextRulesetIndex: number;

    constructor(
        public readonly rulesetManager: RulesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(rulesetRefs: RulesetRefData[]) {
        this.rulesetRefs = rulesetRefs;

        if (this.rulesetRefs.length === 0) {
            this.nextRulesetIndex = 0;
        } else {
            const maxIndex = Math.max(...this.rulesetRefs.map(ruleset => ruleset.index));
            this.nextRulesetIndex = maxIndex + 1;
        }
    }

    public serialize(): RulesetRefData[] { return Array.from(this.rulesetRefs); }

    public getRulesetIndex(ruleset: RulesetMetadata): number {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.id === ruleset.id);
        if (!rulesetRef) {
            const rulesetAbsPath = this.rulesetManager.getRulesetAbsById(ruleset.id);
            if (!rulesetAbsPath) return -1;
        
            const rulesetRelPath = PathUtils.relative(this.filePathSystem.relDir, rulesetAbsPath);

            const newRulesetRef: RulesetRefData = {
                index: this.nextRulesetIndex,
                id: ruleset.id,
                name: ruleset.name,
                source: rulesetRelPath,
            }
            this.rulesetRefs.push(newRulesetRef);
            this.nextRulesetIndex += 1;
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
}