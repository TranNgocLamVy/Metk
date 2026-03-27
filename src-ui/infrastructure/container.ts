import { ProjectData, ProjectDataSchema, ProjectMetaData, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { TauriFileSystemProvider } from "./tauriFileSystemProvider";
import { GenericFileRepository } from "./genericFileRepository";
import { ArkTypeJsonSerializer } from "./arkTypeJsonSerializer";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

const fileStorage = new TauriFileSystemProvider();

export const ProjectStorageService = new GenericFileRepository<ProjectData>(fileStorage, new ArkTypeJsonSerializer(ProjectDataSchema));

export const ProjectMetaDataRepo = new GenericFileRepository<ProjectMetaData[]>(fileStorage, new ArkTypeJsonSerializer(ProjectRepoSchema), { baseDir: BaseDirectory.AppData });

export const TilemapStorageService = new GenericFileRepository<TilemapData>(fileStorage, new ArkTypeJsonSerializer(TilemapDataSchema));