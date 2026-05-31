import { v4 as uuidv4 } from "uuid";
import { RulesetMetadata } from "./ruleset.data";
import { TilemapMetadata } from "./tilemap.data";
import { TilesetMetadata } from "./tileset.data";
import { EntityCollectionMetadata } from "./entity-collection.data";

export type ProjectData = {
    id: string;
    name: string;
    version: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    tilemaps: TilemapMetadata[];
    tilesets: TilesetMetadata[];
    rulesets: RulesetMetadata[];
    entityCollections: EntityCollectionMetadata[];
};

export type ProjectMetadata = {
    id: string;
    name: string;
    version: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    directory: string;
};

export type ProjectRepoData = ProjectMetadata[];

export const defaultProjectData = (payload: Partial<ProjectData>): ProjectData => ({
    id: uuidv4(),
    name: payload.name || "Untitled Project",
    version: "0.1.0",
    description: "",
    createdAt: new Date().toDateString(),
    updatedAt: new Date().toDateString(),
    tilemaps: [],
    tilesets: [],
    rulesets: [],
    entityCollections: [],
});
