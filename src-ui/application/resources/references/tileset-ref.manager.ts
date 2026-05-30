import { TilesetManager } from "../tileset/tileset.manager";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { TilesetRefData } from "@/shared/data-types/tileset.data";

/** Manages references to tilesets, maintaining a mapping between ruleset IDs and their numerical indices. */
export class TilesetRefManager {
    private tilesetRefs: TilesetRefData[] = []
    private nextIndex: number = 0;

    constructor(
        public readonly tilesetManager: TilesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public loadData(tilesetRefs: TilesetRefData[], nextIndex: number) {
        this.tilesetRefs = tilesetRefs || [];
        this.nextIndex = Number.isNaN(nextIndex) || nextIndex == null ? 0 : nextIndex;
    }

    /** Retrieves a list of all currently tracked tileset IDs. */
    public getRefIds(): string[] {
        const ids = this.tilesetRefs.map(ref => ref.id);
        return ids;
    }

    /** Adds a new tileset to the reference list if it doesn't already exist. */
    public addTilesetToRefs(tilesetId: string): void {
        if (this.tilesetRefs.find(ref => ref.id === tilesetId)) return;
        
        const tileset = this.tilesetManager.getTilesetMetadataById(tilesetId);
        if (!tileset) return;
        
        this.tilesetRefs.push({ index: this.nextIndex, id: tileset.id, name: tileset.name });
        this.nextIndex += 1;
    }

    /**
     * Gets the unique numerical index assigned to a specific tileset ID.
     * If the tileset is not currently referenced, it will be added first.
     * * @param tilesetId - The ID of the tileset to look up.
     * @returns The numerical index assigned to the tileset, or -1 if it couldn't be added.
     */
    public getTilesetRefIndex(tilesetId: string): number {
        const tilesetRef = this.tilesetRefs.find(tilesetRef => tilesetRef.id === tilesetId);
        if (!tilesetRef) this.addTilesetToRefs(tilesetId);
        return this.tilesetRefs.find(tilesetRef => tilesetRef.id === tilesetId)?.index ?? -1;
    }

    /**
     * Looks up a tileset ID based on its assigned numerical index.
     * * @param tilesetIndex - The numerical index to look up.
     * @returns The corresponding tileset ID, or null if no reference matches the index.
     */
    public getTilesetRefId(tilesetIndex: number): string | null {
        const tilesetRef = this.tilesetRefs.find(tilesetRef => tilesetRef.index === tilesetIndex);
        if (!tilesetRef) return null;
        return tilesetRef.id;
    }

    /**
     * Replaces an existing tileset reference with a new tileset ID.
     * * @param tilesetId - The current ID of the tileset to be replaced.
     * @param newTilesetId - The new ID to assign to this reference.
     */
    public replaceTilesetRef(tilesetId: string, newTilesetId: string): void {
        const refToUpdate = this.tilesetRefs.find(ref => ref.id === tilesetId);
        const refToAdd = this.tilesetManager.getTilesetMetadataById(newTilesetId);
        if (refToUpdate && refToAdd) {
            refToUpdate.id = newTilesetId;
            refToUpdate.name = refToAdd.name;
        }
    }

    /**
     * Removes a tileset reference from the manager based on its ID.
     * * @param tilesetId - The ID of the tileset to remove.
     * @returns The assigned numerical index of the removed tileset, or -1 if it was not found.
     */
    public removeTilesetRef(tileset: string | number): number {
        const tilesetRefIndex = typeof tileset === "string" ? this.tilesetRefs.find(ref => ref.id === tileset)?.index : tileset;
        if (tilesetRefIndex === undefined || tilesetRefIndex === -1) return -1;
        this.tilesetRefs = this.tilesetRefs.filter(tilesetRef => tilesetRef.index !== tilesetRefIndex);
        return tilesetRefIndex;
    }

    public serialize() {
        return {
            refs: Array.from(this.tilesetRefs),
            nextIndex: this.nextIndex,
        }
    }
}