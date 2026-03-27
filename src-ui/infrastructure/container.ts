import { ProjectData, ProjectDataSchema, ProjectMetaData, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { TauriFileSystemProvider } from "./tauriFileSystemProvider";
import { JsonFileRepository } from "./jsonFileRepository";
import { ArkTypeJsonSerializer } from "./serializer/arkTypeJsonSerializer";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { TilesetData, TilesetDataSchema } from "@/shared/schema/tilesetSchema";
import { WorkpsaceData } from "@/shared/schema/workspaceSchema";

const fileStorage = new TauriFileSystemProvider();

export const ProjectMetaDataRepo = new JsonFileRepository<ProjectMetaData[]>(fileStorage, new ArkTypeJsonSerializer(), { baseDir: BaseDirectory.AppData });
export const ProjectStorageService = new JsonFileRepository<ProjectData>(fileStorage, new ArkTypeJsonSerializer());
export const TilemapStorageService = new JsonFileRepository<TilemapData>(fileStorage, new ArkTypeJsonSerializer());
export const TilesetStorageService = new JsonFileRepository<TilesetData>(fileStorage, new ArkTypeJsonSerializer());
export const WorkspaceStorageService = new JsonFileRepository<WorkpsaceData>(fileStorage, new ArkTypeJsonSerializer());