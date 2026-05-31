import { EntityDefinitionData } from "./entity.data";

export type EntityCollectionData = {
    id: string;
    name: string;
    entities: EntityDefinitionData[];
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