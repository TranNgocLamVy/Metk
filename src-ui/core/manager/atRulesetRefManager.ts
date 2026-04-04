import { ATRulesetMetadata, ATRulesetRefData } from "@/shared/schema/atRuleSchema";
import { ATRulesetManager } from "./atRulesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";



export class ATRulesetRefManager {
    public atRulesetRef: ATRulesetRefData[] = []
    private nextAtRulesetIndex: number;

    constructor(
        public readonly atRulesetManager: ATRulesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(atRulesetRef: ATRulesetRefData[]) {
        this.atRulesetRef = atRulesetRef;

        if (this.atRulesetRef.length === 0) {
            this.nextAtRulesetIndex = 0;
        } else {
            const maxIndex = Math.max(...this.atRulesetRef.map(atRuleset => atRuleset.index));
            this.nextAtRulesetIndex = maxIndex + 1;
        }
    }

    public serialize(): ATRulesetRefData[] { return this.atRulesetRef; }    

    public getAtRulesetIndex(atRuleset: ATRulesetMetadata): number {
        const atRulesetRef = this.atRulesetRef.find(atRulesetRef => atRulesetRef.id === atRuleset.id);
        if (!atRulesetRef) {
            const atRulesetAbsPath = this.atRulesetManager.getAtRulesetAbsById(atRuleset.id);
            if (!atRulesetAbsPath) return -1;
        
            const atRulesetRelPath = this.filePathSystem.relPath;

            const newAtRulesetRef: ATRulesetRefData = {
                index: this.nextAtRulesetIndex,
                id: atRuleset.id,
                name: atRuleset.name,
                source: atRulesetRelPath,
            }
            this.atRulesetRef.push(newAtRulesetRef);
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