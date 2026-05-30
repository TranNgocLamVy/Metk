import { EntityDefinitionData } from "./entity.data";

export type EntityCollectionData = {
    id: string;
    name: string;
    entities?: EntityDefinitionData[];
};
