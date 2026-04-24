import { RulesetMetadata, RulesetRefData } from "@/shared/schema/rulesetSchema";
import { RulesetManager } from "./rulesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";



export class RulesetRefManager {
    public rulesetRefs: RulesetRefData[] = []
    private nextIndex: number;

    constructor(
        public readonly rulesetManager: RulesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(rulesetRefs: RulesetRefData[], nextIndex: number) {
        this.rulesetRefs = rulesetRefs;
        this.nextIndex = nextIndex ?? 0;
    }

    public addRulesetToRefs(rulesetId: string): void {
        if (this.rulesetRefs.find(rulesetRef => rulesetRef.id === rulesetId)) return;
        const ruleset = this.rulesetManager.getRulesetMetadataById(rulesetId);
        if (!ruleset) return;
        this.rulesetRefs.push({ index: this.nextIndex, id: ruleset.id, name: ruleset.name });
        this.nextIndex += 1;
    }

    public removeRulesetFromRefs(rulesetId: string): void {
        const rulesetRefIndex = this.getRulesetRefIndex(rulesetId);
        if (rulesetRefIndex === -1) return;
        this.rulesetRefs = this.rulesetRefs.filter(rulesetRef => rulesetRef.id !== rulesetId);
    }

    public replaceRulesetRef(rulesetId: string, newRulesetId: string): void {
        const rulesetRefIndex = this.getRulesetRefIndex(rulesetId);
        if (rulesetRefIndex === -1) return;
        this.rulesetRefs[rulesetRefIndex].id = newRulesetId;
    }

    public getRulesetRefIndex(rulesetId: string): number {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.id === rulesetId);
        if (!rulesetRef) this.addRulesetToRefs(rulesetId);
        return this.rulesetRefs.find(rulesetRef => rulesetRef.id === rulesetId)!.index;
    }

    public getRulesetIndex(ruleset: RulesetMetadata): number {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.id === ruleset.id);
        if (!rulesetRef) {
            const newRulesetRef: RulesetRefData = {
                index: this.nextIndex,
                id: ruleset.id,
                name: ruleset.name,
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