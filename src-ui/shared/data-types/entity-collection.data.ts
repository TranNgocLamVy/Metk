import { EntityDefinitionData } from "./entity.data";
import { TilesetRefData } from "./tileset.data";

export type EntityCollectionData = {
    id: string;
    cloneFrom?: string;
    name: string;
    entities: EntityDefinitionData[];
    tilesets: {
        refs: TilesetRefData[];
        nextIndex: number;
    };
    createdAt: string;
    updatedAt: string;
};

export type EntityCollectionMetadata = {
    name: string;
    id: string;
    entityCollectionRelPath: string;
};

export type EntityCollectionRefData = {
    id: string;
    index: number;
    name: string;
};

export type CreateEntityCollectionPayload = Pick<EntityCollectionData, "id" | "name">;
