import { StorageOptions } from "@/infrastructure/interface/storage-provider.interface";

export type ExampleProjectTemplateManifest = {
    id: string;
    name: string;
    description?: string;
    templateVersion: string;
    metkSchemaVersion?: string;
    minMetkVersion?: string;
    rootDir: string;
    entry: string;
    previewImage?: string;
    tags?: string[];
    clone?: {
        remapUuid?: boolean;
        preserveRelativePaths?: boolean;
        copyPreviewImage?: boolean;
        preserveCloneSource?: boolean;
    };
};

export type DiscoveredExampleProjectTemplate = {
    manifest: ExampleProjectTemplateManifest;
    templateDir: string;
    manifestPath: string;
    storageOptions: StorageOptions;
};

export type CreateExampleProjectPayload = {
    template: DiscoveredExampleProjectTemplate;
    destinationDir: string;
    projectName: string;
};

export type ExampleProjectCloneResult = {
    projectAbsDir: string;
    projectEntryAbsPath: string;
};
