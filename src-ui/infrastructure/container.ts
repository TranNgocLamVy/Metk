import { ProjectData, ProjectDataSchema, ProjectMetadata, ProjectRepoSchema } from "@/shared/schema/project.schema";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemap.schema";
import { TauriFileSystemProvider } from "./tauri-filesystem.provider";
import { JsonStorageService } from "./json-storage.service";
import { ArkTypeJsonSerializer } from "./arktype-json.serializer";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { TilesetData, TilesetDataSchema } from "@/shared/schema/tileset.schema";
import { WorkpsaceData, WorkpsaceDataSchema } from "@/shared/schema/workspaceSchema";
import { RulesetData, RulesetDataSchema } from "@/shared/schema/ruleset.schema";
import { IJsonModel } from "flexlayout-react";

export const TauriFileStorage = new TauriFileSystemProvider();

export const ProjectMetadataRepo = new JsonStorageService<ProjectMetadata[]>(TauriFileStorage, new ArkTypeJsonSerializer(ProjectRepoSchema), { baseDir: BaseDirectory.AppData });
export const ProjectStorageService = new JsonStorageService<ProjectData>(
    TauriFileStorage, 
    new ArkTypeJsonSerializer(ProjectDataSchema)
);
export const TilemapStorageService = new JsonStorageService<TilemapData>(TauriFileStorage, new ArkTypeJsonSerializer(TilemapDataSchema));
export const TilesetStorageService = new JsonStorageService<TilesetData>(TauriFileStorage, new ArkTypeJsonSerializer(TilesetDataSchema));
export const WorkspaceStorageService = new JsonStorageService<WorkpsaceData>(TauriFileStorage, new ArkTypeJsonSerializer(WorkpsaceDataSchema));
export const LayoutStorageService = new JsonStorageService<IJsonModel>(TauriFileStorage, new ArkTypeJsonSerializer());
export const RulesetStorageService = new JsonStorageService<RulesetData>(TauriFileStorage, new ArkTypeJsonSerializer(RulesetDataSchema));