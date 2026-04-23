import { ProjectData, ProjectDataSchema, ProjectMetadata, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { TauriFileSystemProvider } from "./tauriFileSystemProvider";
import { JsonFileRepository } from "./jsonFileRepository";
import { ArkTypeJsonSerializer } from "./arkTypeJsonSerializer";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { TilesetData, TilesetDataSchema } from "@/shared/schema/tilesetSchema";
import { WorkpsaceData, WorkpsaceDataSchema } from "@/shared/schema/workspaceSchema";
import { RulesetData, RulesetDataSchema } from "@/shared/schema/ruleSchema";
import { IJsonModel } from "flexlayout-react";

export const TauriFileStorage = new TauriFileSystemProvider();

export const ProjectMetadataRepo = new JsonFileRepository<ProjectMetadata[]>(TauriFileStorage, new ArkTypeJsonSerializer(ProjectRepoSchema), { baseDir: BaseDirectory.AppData });
export const ProjectStorageService = new JsonFileRepository<ProjectData>(TauriFileStorage, new ArkTypeJsonSerializer(ProjectDataSchema));
export const TilemapStorageService = new JsonFileRepository<TilemapData>(TauriFileStorage, new ArkTypeJsonSerializer(TilemapDataSchema));
export const TilesetStorageService = new JsonFileRepository<TilesetData>(TauriFileStorage, new ArkTypeJsonSerializer(TilesetDataSchema));
export const WorkspaceStorageService = new JsonFileRepository<WorkpsaceData>(TauriFileStorage, new ArkTypeJsonSerializer(WorkpsaceDataSchema));
export const LayoutStorageService = new JsonFileRepository<IJsonModel>(TauriFileStorage, new ArkTypeJsonSerializer());
export const RulesetStorageService = new JsonFileRepository<RulesetData>(TauriFileStorage, new ArkTypeJsonSerializer(RulesetDataSchema));