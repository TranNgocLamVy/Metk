import { ProjectData, ProjectDataSchema, ProjectMetadata, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { TauriFileSystemProvider } from "./tauriFileSystemProvider";
import { JsonStorageService } from "./jsonStorageService";
import { ArkTypeJsonSerializer } from "./arkTypeJsonSerializer";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { TilesetData, TilesetDataSchema } from "@/shared/schema/tilesetSchema";
import { WorkpsaceData, WorkpsaceDataSchema } from "@/shared/schema/workspaceSchema";
import { RulesetData, RulesetDataSchema } from "@/shared/schema/rulesetSchema";
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