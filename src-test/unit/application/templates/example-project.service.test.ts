import { describe, expect, it, vi } from "vitest";

import { ExampleProjectService } from "@/application/templates/example-project.service";
import { IFileSystemService } from "@/infrastructure/interface/file-system-service.interface";
import { Result } from "@/shared/types/result";

type Entry = {
    name: string;
    isFile?: boolean;
    isDirectory?: boolean;
};

const createTemplateFileSystem = () => {
    const dirs = new Map<string, Entry[]>([
        ["data/example-projects", [{ name: "starter-example", isDirectory: true }]],
        ["data/example-projects/starter-example/project", [{ name: ".metk", isDirectory: true }, { name: "assets", isDirectory: true }]],
        ["data/example-projects/starter-example/project/.metk", [{ name: "project.json", isFile: true }]],
        ["data/example-projects/starter-example/project/assets", [{ name: "tiles.png", isFile: true }]],
    ]);

    const files = new Set([
        "data/example-projects/starter-example/example-template.manifest.json",
        "data/example-projects/starter-example/preview.png",
        "data/example-projects/starter-example/project/.metk/project.json",
        "data/example-projects/starter-example/project/assets/tiles.png",
    ]);

    const copied: { from: string; to: string; options: unknown }[] = [];

    const fileSystem: IFileSystemService & { copied: typeof copied } = {
        copied,
        exists: vi.fn(async (path: string) => files.has(path) || dirs.has(path) || path === "C:/projects" ? path !== "C:/projects/My Starter Example" : false),
        readDir: vi.fn(async (path: string) => {
            const entries = dirs.get(path);
            if (!entries) throw new Error(`Missing directory: ${path}`);
            return entries.map((entry) => ({
                name: entry.name,
                isFile: entry.isFile ?? false,
                isDirectory: entry.isDirectory ?? false,
            }));
        }),
        readTextFile: vi.fn(async (path: string) => {
            if (path !== "data/example-projects/starter-example/example-template.manifest.json") {
                throw new Error(`Unexpected read: ${path}`);
            }

            return JSON.stringify({
                id: "starter-example",
                name: "Starter Example",
                description: "A starter template",
                templateVersion: "1.0.0",
                rootDir: "project",
                entry: "project/.metk/project.json",
                previewImage: "preview.png",
                tags: ["starter"],
                clone: {
                    remapUuid: true,
                    copyPreviewImage: false,
                    preserveCloneSource: true,
                },
            });
        }),
        copyFile: vi.fn(async (fromPath: string, toPath: string, options: unknown) => {
            copied.push({ from: fromPath, to: toPath, options });
            return Result.Success();
        }),
        mkdir: vi.fn(async () => Result.Success()),
        writeTextFile: vi.fn(async () => Result.Success()),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        removeFile: vi.fn(),
    };

    return fileSystem;
};

describe("ExampleProjectService", () => {
    it("discovers bundled manifests and clones only the template project directory", async () => {
        const fileSystem = createTemplateFileSystem();
        const remapper = { remapProject: vi.fn(async () => Result.Success()) };
        const service = new ExampleProjectService(fileSystem, remapper as any);

        const templatesResult = await service.discoverBundledTemplates();
        expect(templatesResult.status).toBe(Result.Status.Success);
        if (templatesResult.status !== Result.Status.Success) throw new Error("Expected template discovery to succeed");

        expect(templatesResult.data).toHaveLength(1);
        expect(templatesResult.data[0].manifest).toMatchObject({
            id: "starter-example",
            name: "Starter Example",
            tags: ["starter"],
        });

        const cloneResult = await service.createProjectFromTemplate({
            template: templatesResult.data[0],
            destinationDir: "C:/projects",
            projectName: "My Starter Example",
        });

        expect(cloneResult.status).toBe(Result.Status.Success);
        expect(cloneResult.data).toEqual({
            projectAbsDir: "C:/projects/My Starter Example",
            projectEntryAbsPath: "C:/projects/My Starter Example/.metk/project.json",
        });
        expect(fileSystem.copied).toEqual([
            {
                from: "data/example-projects/starter-example/project/.metk/project.json",
                to: "C:/projects/My Starter Example/.metk/project.json",
                options: { fromPathBaseDir: expect.anything() },
            },
            {
                from: "data/example-projects/starter-example/project/assets/tiles.png",
                to: "C:/projects/My Starter Example/assets/tiles.png",
                options: { fromPathBaseDir: expect.anything() },
            },
        ]);
        expect(fileSystem.copied.some((copy) => copy.from.includes("example-template.manifest.json"))).toBe(false);
        expect(fileSystem.copied.some((copy) => copy.from.includes("preview.png"))).toBe(false);
        expect(remapper.remapProject).toHaveBeenCalledWith({
            projectAbsDir: "C:/projects/My Starter Example",
            projectEntryRelPath: ".metk/project.json",
            projectName: "My Starter Example",
            preserveCloneSource: true,
        });
    });
});
