import { ProjectData, ProjectDataSchema, ProjectMetaData, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { TauriFileSystemProvider } from "./tauriFileSystemProvider";
import { JsonFileRepository } from "./jsonFileRepository";
import { ArkTypeJsonSerializer } from "./serializer/arkTypeJsonSerializer";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { TilesetData, TilesetDataSchema } from "@/shared/schema/tilesetSchema";
import { WorkpsaceData } from "@/shared/schema/workspaceSchema";

export const TauriFileStorage = new TauriFileSystemProvider();

export const ProjectMetaDataRepo = new JsonFileRepository<ProjectMetaData[]>(TauriFileStorage, new ArkTypeJsonSerializer(), { baseDir: BaseDirectory.AppData });
export const ProjectStorageService = new JsonFileRepository<ProjectData>(TauriFileStorage, new ArkTypeJsonSerializer());
export const TilemapStorageService = new JsonFileRepository<TilemapData>(TauriFileStorage, new ArkTypeJsonSerializer());
export const TilesetStorageService = new JsonFileRepository<TilesetData>(TauriFileStorage, new ArkTypeJsonSerializer());
export const WorkspaceStorageService = new JsonFileRepository<WorkpsaceData>(TauriFileStorage, new ArkTypeJsonSerializer());