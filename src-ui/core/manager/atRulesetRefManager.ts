import { ATRulesetMetadata, ATRulesetRefData } from "@/shared/schema/atRuleSchema";
import { ATRulesetManager } from "./atRulesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { PathUtils } from "@/shared/utils/pathUtils";



export class ATRulesetRefManager {
    public atRulesetRefs: ATRulesetRefData[] = []
    private nextAtRulesetIndex: number;

    constructor(
        public readonly atRulesetManager: ATRulesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(atRulesetRefs: ATRulesetRefData[]) {
        this.atRulesetRefs = atRulesetRefs;

        if (this.atRulesetRefs.length === 0) {
            this.nextAtRulesetIndex = 0;
        } else {
            const maxIndex = Math.max(...this.atRulesetRefs.map(atRuleset => atRuleset.index));
            this.nextAtRulesetIndex = maxIndex + 1;
        }
    }

    public serialize(): ATRulesetRefData[] { return Array.from(this.atRulesetRefs); }

    public getAtRulesetIndex(atRuleset: ATRulesetMetadata): number {
        const atRulesetRef = this.atRulesetRefs.find(atRulesetRef => atRulesetRef.id === atRuleset.id);
        if (!atRulesetRef) {
            const atRulesetAbsPath = this.atRulesetManager.getAtRulesetAbsById(atRuleset.id);
            if (!atRulesetAbsPath) return -1;
        
            const atRulesetRelPath = PathUtils.relative(this.filePathSystem.relDir, atRulesetAbsPath);

            const newAtRulesetRef: ATRulesetRefData = {
                index: this.nextAtRulesetIndex,
                id: atRuleset.id,
                name: atRuleset.name,
                source: atRulesetRelPath,
            }
            this.atRulesetRefs.push(newAtRulesetRef);
            this.nextAtRulesetIndex += 1;
            return newAtRulesetRef.index;
        }
        return atRulesetRef.index;
    }

    public getAtRulesetIndexById(atRulesetId: string): number {
        const atRulesetMetadata = this.atRulesetManager.getAtRulesetMetadataById(atRulesetId);
        if (!atRulesetMetadata) return -1;
        return this.getAtRulesetIndex(atRulesetMetadata);
    }
}