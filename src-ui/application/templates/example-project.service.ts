import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { resourceDir } from "@tauri-apps/api/path";

import { FileSystemService } from "@/infrastructure/container";
import { IFileSystemService } from "@/infrastructure/interface/file-system-service.interface";
import { DirectoryEntry, StorageOptions } from "@/infrastructure/interface/storage-provider.interface";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/path.utils";
import { Console } from "@/ui/notifications/console-gateway";
import { ExampleProjectRemapper } from "./example-project-remapper";
import {
    CreateExampleProjectPayload,
    DiscoveredExampleProjectTemplate,
    ExampleProjectCloneResult,
    ExampleProjectTemplateManifest,
} from "./example-project.types";
import i18n from "@/app/providers/i18n";

const EXAMPLE_PROJECTS_RESOURCE_DIR = "data/example-projects";
const MANIFEST_FILE_NAME = "example-template.manifest.json";
const SUPPORTED_TEMPLATE_MAJOR_VERSION = 1;

type TemplateRoot = {
    path: string;
    storageOptions?: StorageOptions;
};

export class ExampleProjectService {
    public constructor(
        private readonly fileSystem: IFileSystemService = FileSystemService,
        private readonly remapper = new ExampleProjectRemapper(fileSystem),
    ) {}

    public async discoverBundledTemplates(): Promise<Result<DiscoveredExampleProjectTemplate[]>> {
        const templateRoots = await this.getTemplateRoots();
        const templates: DiscoveredExampleProjectTemplate[] = [];
        const discoveredIds = new Set<string>();

        for (const root of templateRoots) {
            let entries: DirectoryEntry[];
            try {
                entries = await this.fileSystem.readDir(root.path, root.storageOptions);
            } catch (error) {
                if (root.path === EXAMPLE_PROJECTS_RESOURCE_DIR) {
                    return Result.Error({
                        key: "message.project.exampleTemplate.discoverFail",
                        options: { error: String(error) },
                    });
                }
                continue;
            }

            for (const entry of entries) {
                if (!entry.isDirectory) continue;

                const templateDir = PathUtils.join(root.path, entry.name);
                const manifestPath = PathUtils.join(templateDir, MANIFEST_FILE_NAME);
                const manifestResult = await this.loadManifest(manifestPath, root.storageOptions);

                if (manifestResult.status !== Result.Status.Success) {
                    Console.warn({
                        message: {
                            key: "message.project.exampleTemplate.skipped",
                            options: {
                                name: entry.name,
                                reason: messageToString(manifestResult.message),
                            },
                        },
                    });
                    continue;
                }

                if (discoveredIds.has(manifestResult.data.id)) continue;
                discoveredIds.add(manifestResult.data.id);

                templates.push({
                    manifest: manifestResult.data,
                    templateDir,
                    manifestPath,
                    storageOptions: root.storageOptions ?? {},
                });
            }
        }

        return Result.Success(templates);
    }

    public async createProjectFromTemplate(payload: CreateExampleProjectPayload): Promise<Result<ExampleProjectCloneResult>> {
        const templateValidationResult = this.validateTemplateVersion(payload.template.manifest);
        if (templateValidationResult.status !== Result.Status.Success) return templateValidationResult;

        const projectAbsDir = PathUtils.join(payload.destinationDir, payload.projectName);
        if (await this.fileSystem.exists(projectAbsDir)) {
            return Result.Error({
                key: "message.project.exampleTemplate.destinationExists",
                options: { path: projectAbsDir },
            });
        }

        const sourceProjectDir = PathUtils.join(payload.template.templateDir, payload.template.manifest.rootDir);
        const sourceEntryPath = PathUtils.join(payload.template.templateDir, payload.template.manifest.entry);

        const sourceEntryExists = await this.fileSystem.exists(sourceEntryPath, payload.template.storageOptions);
        if (!sourceEntryExists) {
            return Result.Error({
                key: "message.project.exampleTemplate.entryMissing",
                options: { entry: payload.template.manifest.entry },
            });
        }

        const mkdirResult = await this.fileSystem.mkdir(projectAbsDir, { recursive: true });
        if (mkdirResult.status !== Result.Status.Success) {
            return Result.Error("message.project.exampleTemplate.destinationCreateFail", mkdirResult);
        }

        const copyResult = await this.copyDirectoryFromResource(
            sourceProjectDir,
            projectAbsDir,
            payload.template.storageOptions,
        );
        if (copyResult.status !== Result.Status.Success) return copyResult;

        if (payload.template.manifest.clone?.copyPreviewImage && payload.template.manifest.previewImage) {
            const previewCopyResult = await this.copyPreviewImage(payload.template, projectAbsDir);
            if (previewCopyResult.status !== Result.Status.Success) return previewCopyResult;
        }

        const projectEntryRelPath = this.getClonedEntryRelPath(payload.template.manifest);
        const projectEntryAbsPath = PathUtils.join(projectAbsDir, projectEntryRelPath);

        if (payload.template.manifest.clone?.remapUuid ?? true) {
            const remapResult = await this.remapper.remapProject({
                projectAbsDir,
                projectEntryRelPath,
                projectName: payload.projectName,
                preserveCloneSource: payload.template.manifest.clone?.preserveCloneSource ?? true,
            });

            if (remapResult.status !== Result.Status.Success) return remapResult;
        }

        return Result.Success({
            projectAbsDir,
            projectEntryAbsPath,
        });
    }

    private async loadManifest(path: string, storageOptions?: StorageOptions): Promise<Result<ExampleProjectTemplateManifest>> {
        let content: string;
        try {
            content = await this.fileSystem.readTextFile(path, storageOptions);
        } catch (error) {
            return Result.Error({
                key: "message.project.exampleTemplate.manifestMissing",
                options: { path, error: String(error) },
            });
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch (error) {
            return Result.Error({
                key: "message.project.exampleTemplate.manifestInvalidJson",
                options: { error: String(error) },
            });
        }

        return this.normalizeManifest(parsed);
    }

    private normalizeManifest(value: unknown): Result<ExampleProjectTemplateManifest> {
        if (!isRecord(value)) return Result.Error("message.project.exampleTemplate.manifestExpectedObject");

        const id = requiredString(value.id, "id");
        const name = requiredString(value.name, "name");
        const templateVersion = requiredString(value.templateVersion, "templateVersion");
        const rootDir = requiredString(value.rootDir, "rootDir");
        const entry = requiredString(value.entry, "entry");

        if (id.status !== Result.Status.Success) return Result.Error(id.message);
        if (name.status !== Result.Status.Success) return Result.Error(name.message);
        if (templateVersion.status !== Result.Status.Success) return Result.Error(templateVersion.message);
        if (rootDir.status !== Result.Status.Success) return Result.Error(rootDir.message);
        if (entry.status !== Result.Status.Success) return Result.Error(entry.message);

        const manifest: ExampleProjectTemplateManifest = {
            id: id.data,
            name: name.data,
            description: optionalString(value.description),
            templateVersion: templateVersion.data,
            metkSchemaVersion: optionalString(value.metkSchemaVersion),
            minMetkVersion: optionalString(value.minMetkVersion),
            rootDir: rootDir.data,
            entry: entry.data,
            previewImage: optionalString(value.previewImage),
            tags: optionalStringArray(value.tags),
            clone: normalizeCloneOptions(value.clone),
        };

        const versionValidation = this.validateTemplateVersion(manifest);
        if (versionValidation.status !== Result.Status.Success) return versionValidation;

        return Result.Success(manifest);
    }

    private validateTemplateVersion(manifest: ExampleProjectTemplateManifest): Result {
        const major = Number(manifest.templateVersion.split(".")[0]);
        if (!Number.isFinite(major) || major !== SUPPORTED_TEMPLATE_MAJOR_VERSION) {
            return Result.Error({
                key: "message.project.exampleTemplate.versionUnsupported",
                options: { version: manifest.templateVersion },
            });
        }

        return Result.Success();
    }

    private async getTemplateRoots(): Promise<TemplateRoot[]> {
        const roots: TemplateRoot[] = [
            {
                path: EXAMPLE_PROJECTS_RESOURCE_DIR,
                storageOptions: { baseDir: BaseDirectory.Resource },
            },
        ];

        if (import.meta.env.DEV) {
            const sourceRoot = await this.tryGetSourceTemplateRoot();
            if (sourceRoot) roots.push({ path: sourceRoot });
        }

        return roots;
    }

    private async tryGetSourceTemplateRoot(): Promise<string | null> {
        try {
            const resourceRoot = await resourceDir();
            return PathUtils.join(resourceRoot, "..", "..", "data", "example-projects");
        } catch {
            return null;
        }
    }

    private getClonedEntryRelPath(manifest: ExampleProjectTemplateManifest): string {
        const relativeEntry = PathUtils.relative(manifest.rootDir, manifest.entry);
        return relativeEntry === "." ? PathUtils.basename(manifest.entry) : relativeEntry;
    }

    private async copyDirectoryFromResource(
        sourceDir: string,
        destinationDir: string,
        sourceOptions: StorageOptions,
    ): Promise<Result> {
        let entries: DirectoryEntry[];
        try {
            entries = await this.fileSystem.readDir(sourceDir, sourceOptions);
        } catch (error) {
            return Result.Error({
                key: "message.project.exampleTemplate.directoryReadFail",
                options: { path: sourceDir, error: String(error) },
            });
        }

        const mkdirResult = await this.fileSystem.mkdir(destinationDir, { recursive: true });
        if (mkdirResult.status !== Result.Status.Success) return mkdirResult;

        for (const entry of entries) {
            const sourcePath = PathUtils.join(sourceDir, entry.name);
            const destinationPath = PathUtils.join(destinationDir, entry.name);

            if (entry.isDirectory) {
                const childResult = await this.copyDirectoryFromResource(sourcePath, destinationPath, sourceOptions);
                if (childResult.status !== Result.Status.Success) return childResult;
                continue;
            }

            if (!entry.isFile) continue;

            const copyResult = await this.fileSystem.copyFile(sourcePath, destinationPath, {
                fromPathBaseDir: sourceOptions.baseDir,
            });

            if (copyResult.status !== Result.Status.Success) {
                return Result.Error({
                    key: "message.project.exampleTemplate.fileCopyFail",
                    options: { path: sourcePath },
                }, copyResult);
            }
        }

        return Result.Success();
    }

    private async copyPreviewImage(template: DiscoveredExampleProjectTemplate, projectAbsDir: string): Promise<Result> {
        const previewImage = template.manifest.previewImage;
        if (!previewImage) return Result.Success();

        const sourcePreviewPath = PathUtils.join(template.templateDir, previewImage);
        const destinationPreviewPath = PathUtils.join(projectAbsDir, PathUtils.basename(previewImage));

        const copyResult = await this.fileSystem.copyFile(sourcePreviewPath, destinationPreviewPath, {
            fromPathBaseDir: template.storageOptions.baseDir,
        });

        if (copyResult.status !== Result.Status.Success) {
            return Result.Error({
                key: "message.project.exampleTemplate.previewCopyFail",
                options: { path: previewImage },
            }, copyResult);
        }

        return Result.Success();
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): Result<string> {
    if (typeof value !== "string" || value.trim().length === 0) {
        return Result.Error({
            key: "message.project.exampleTemplate.manifestFieldRequired",
            options: { field },
        });
    }
    return Result.Success(value);
}

function optionalString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.filter((item): item is string => typeof item === "string");
}

function normalizeCloneOptions(value: unknown): ExampleProjectTemplateManifest["clone"] {
    if (!isRecord(value)) return undefined;

    return {
        remapUuid: optionalBoolean(value.remapUuid),
        preserveRelativePaths: optionalBoolean(value.preserveRelativePaths),
        copyPreviewImage: optionalBoolean(value.copyPreviewImage),
        preserveCloneSource: optionalBoolean(value.preserveCloneSource),
    };
}

function optionalBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function messageToString(message: Result["message"]): string {
    if (!message) return i18n.t("message.system.unknownError.default");
    if (typeof message === "string") return i18n.t(message);
    return i18n.t(message.key, message.options);
}
