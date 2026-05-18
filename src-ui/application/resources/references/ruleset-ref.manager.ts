import { RulesetRefData } from "@/shared/schema/ruleset.schema";
import { RulesetManager } from "../ruleset/ruleset.manager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";

/** Manages references to rulesets, maintaining a mapping between ruleset IDs and their numerical indices. */
export class RulesetRefManager {
    private rulesetRefs: RulesetRefData[] = []    
    private nextIndex: number;

    constructor(
        public readonly rulesetManager: RulesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public loadData(rulesetRefs: RulesetRefData[], nextIndex: number) {
        this.rulesetRefs = rulesetRefs || [];
        this.nextIndex = Number.isNaN(nextIndex) || nextIndex == null ? 0 : nextIndex;
    }

    /** Retrieves a list of all currently tracked ruleset IDs. */
    public getRefIds(): string[] {
        const ids = this.rulesetRefs.map(ref => ref.id);
        return ids;
    }

    /** Adds a new ruleset to the reference list if it doesn't already exist. */
    public addRulesetToRefs(rulesetId: string): void {
        if (this.rulesetRefs.find(ref => ref.id === rulesetId)) return;
        
        const ruleset = this.rulesetManager.getRulesetMetadataById(rulesetId);
        if (!ruleset) return;
        
        this.rulesetRefs.push({ index: this.nextIndex, id: ruleset.id, name: ruleset.name });
        this.nextIndex += 1;
    }

    /**
     * Gets the unique numerical index assigned to a specific ruleset ID.
     * If the ruleset is not currently referenced, it will be added first.
     * @param rulesetId - The ID of the ruleset to look up.
     * @returns The numerical index assigned to the ruleset.
     */
    public getRulesetRefIndex(rulesetId: string): number {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.id === rulesetId);
        if (!rulesetRef) this.addRulesetToRefs(rulesetId);
        return this.rulesetRefs.find(rulesetRef => rulesetRef.id === rulesetId)?.index ?? -1;
    }

    /**
     * Looks up a ruleset ID based on its assigned numerical index.
     * @param rulesetIndex - The numerical index to look up.
     * @returns The corresponding ruleset ID, or null if no reference matches the index.
     */
    public getRulesetRefId(rulesetIndex: number): string | null {
        const rulesetRef = this.rulesetRefs.find(rulesetRef => rulesetRef.index === rulesetIndex);
        if (!rulesetRef) return null;
        return rulesetRef.id;
    }

    /**
     * Replaces an existing ruleset reference with a new ruleset ID.
     * * @param tilesetId - The current ID of the tileset to be replaced.
     * @param newTilesetId - The new ID to assign to this reference.
     */
    public replaceRulesetRef(ruleset: string | number, newRulesetId: string): void {
        const refToUpdate = typeof ruleset === "string" ? this.rulesetRefs.find(ref => ref.id === ruleset) : this.rulesetRefs.find(ref => ref.index === ruleset);
        const refToAdd = this.rulesetManager.getRulesetMetadataById(newRulesetId);
        if (refToUpdate && refToAdd) {
            refToUpdate.id = newRulesetId;
            refToUpdate.name = refToAdd.name;
        }
    }

    /**
     * Removes a ruleset reference from the manager based on its ID.
     * @param rulesetId - The ID of the ruleset to remove.
     * @returns The index property of the removed ruleset, or -1 if it was not found.
     */
    public removeRulesetRef(ruleset: string | number): number {
        const rulesetRefIndex = typeof ruleset === "string" ? this.rulesetRefs.find(ref => ref.id === ruleset)?.index : ruleset;
        if (rulesetRefIndex === undefined || rulesetRefIndex === -1) return -1;
        this.rulesetRefs = this.rulesetRefs.filter(rulesetRef => rulesetRef.index !== rulesetRefIndex);
        return rulesetRefIndex;
    }

    public serialize() {
        return {
            refs: Array.from(this.rulesetRefs),
            nextIndex: this.nextIndex,
        }
    }
}