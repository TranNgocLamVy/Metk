import { UserSettingsData } from "@/application/settings/setting.types";
import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { ProjectData, ProjectMetadata } from "@/shared/data-types/project.data";
import { RulesetData } from "@/shared/data-types/ruleset.data";
import { TilemapData } from "@/shared/data-types/tilemap.data";
import { TilesetData } from "@/shared/data-types/tileset.data";
import { WorkpsaceData } from "@/shared/data-types/workspace.data";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { FileSystemServiceImpl } from "./file-system.service";
import { JsonStorageService } from "./json-storage.service";
import { JsonSerializer } from "./json.serializer";
import { TauriFileDialogService } from "./tauri-file-dialog.service";
import { TauriFileSystemProvider } from "./tauri-filesystem.provider";

export const FileStorageProvider = new TauriFileSystemProvider();
export const FileSystemService = new FileSystemServiceImpl(FileStorageProvider);
export const FileDialogService = new TauriFileDialogService();

export const ProjectMetadataRepo = new JsonStorageService<ProjectMetadata[]>(FileStorageProvider, new JsonSerializer<ProjectMetadata[]>(), { baseDir: BaseDirectory.AppData });
export const ProjectStorageService = new JsonStorageService<ProjectData>(
    FileStorageProvider, 
    new JsonSerializer<ProjectData>()
);
export const TilemapStorageService = new JsonStorageService<TilemapData>(FileStorageProvider, new JsonSerializer<TilemapData>());
export const TilesetStorageService = new JsonStorageService<TilesetData>(FileStorageProvider, new JsonSerializer<TilesetData>());
export const WorkspaceStorageService = new JsonStorageService<WorkpsaceData>(FileStorageProvider, new JsonSerializer<WorkpsaceData>());
export const LayoutStorageService = new JsonStorageService<unknown>(FileStorageProvider, new JsonSerializer<unknown>());
export const RulesetStorageService = new JsonStorageService<RulesetData>(FileStorageProvider, new JsonSerializer<RulesetData>());
export const EntityCollectionStorageService = new JsonStorageService<EntityCollectionData>(FileStorageProvider, new JsonSerializer<EntityCollectionData>());
export const SettingStorageService = new JsonStorageService<UserSettingsData>(FileStorageProvider, new JsonSerializer<UserSettingsData>(), { baseDir: BaseDirectory.AppData });
