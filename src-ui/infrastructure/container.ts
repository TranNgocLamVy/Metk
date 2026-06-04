import { UserSettingsData } from "@/application/settings/setting.types";
import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { ProjectData, ProjectMetadata } from "@/shared/data-types/project.data";
import { RulesetData } from "@/shared/data-types/ruleset.data";
import { TilemapData } from "@/shared/data-types/tilemap.data";
import { TilesetData } from "@/shared/data-types/tileset.data";
import { WorkpsaceData } from "@/shared/data-types/workspace.data";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { JsonStorageService } from "./json-storage.service";
import { JsonSerializer } from "./json.serializer";
import { TauriFileSystemProvider } from "./tauri-filesystem.provider";

export const TauriFileStorage = new TauriFileSystemProvider();

export const ProjectMetadataRepo = new JsonStorageService<ProjectMetadata[]>(TauriFileStorage, new JsonSerializer<ProjectMetadata[]>(), { baseDir: BaseDirectory.AppData });
export const ProjectStorageService = new JsonStorageService<ProjectData>(
    TauriFileStorage, 
    new JsonSerializer<ProjectData>()
);
export const TilemapStorageService = new JsonStorageService<TilemapData>(TauriFileStorage, new JsonSerializer<TilemapData>());
export const TilesetStorageService = new JsonStorageService<TilesetData>(TauriFileStorage, new JsonSerializer<TilesetData>());
export const WorkspaceStorageService = new JsonStorageService<WorkpsaceData>(TauriFileStorage, new JsonSerializer<WorkpsaceData>());
export const LayoutStorageService = new JsonStorageService<unknown>(TauriFileStorage, new JsonSerializer<unknown>());
export const RulesetStorageService = new JsonStorageService<RulesetData>(TauriFileStorage, new JsonSerializer<RulesetData>());
export const EntityCollectionStorageService = new JsonStorageService<EntityCollectionData>(TauriFileStorage, new JsonSerializer<EntityCollectionData>());
export const SettingStorageService = new JsonStorageService<UserSettingsData>(TauriFileStorage, new JsonSerializer<UserSettingsData>(), { baseDir: BaseDirectory.AppData });
