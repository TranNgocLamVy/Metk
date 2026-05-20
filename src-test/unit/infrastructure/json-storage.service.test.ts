import { beforeEach, describe, expect, it, vi } from "vitest";

import { JsonStorageService } from "@/infrastructure/json-storage.service";
import { ISerializer } from "@/infrastructure/interface/serializer.interface";
import { IStorageProvider, StorageOptions } from "@/infrastructure/interface/storage-provider.interface";
import { Result } from "@/shared/types/result";
import { exists } from "@tauri-apps/plugin-fs";

const fsMock = vi.hoisted(() => ({
    exists: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
    exists: fsMock.exists,
}));

const createStorage = (): IStorageProvider => ({
    exists: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    removeFile: vi.fn(),
});

const createSerializer = <T,>(): ISerializer<T> => ({
    serialize: vi.fn(),
    deserialize: vi.fn(),
});

describe("JsonStorageService", () => {
    beforeEach(() => {
        fsMock.exists.mockReset();
    });

    it("checks existence through the filesystem plugin with default options", async () => {
        const options: StorageOptions = { baseDir: "AppData" };
        const service = new JsonStorageService(createStorage(), createSerializer(), options);
        fsMock.exists.mockResolvedValue(true);

        await expect(service.exists("projects/project.json")).resolves.toBe(true);

        expect(exists).toHaveBeenCalledWith("projects/project.json", options);
    });

    it("loads text content and deserializes it", async () => {
        const storage = createStorage();
        const serializer = createSerializer<{ id: string }>();
        const service = new JsonStorageService(storage, serializer);
        vi.mocked(storage.readTextFile).mockResolvedValue(Result.Success('{"id":"project-a"}'));
        vi.mocked(serializer.deserialize).mockReturnValue(Result.Success({ id: "project-a" }));

        await expect(service.load("project.json")).resolves.toEqual({
            status: "Success",
            data: { id: "project-a" },
        });

        expect(storage.readTextFile).toHaveBeenCalledWith("project.json", undefined);
        expect(serializer.deserialize).toHaveBeenCalledWith('{"id":"project-a"}');
    });

    it("propagates read and deserialize failures", async () => {
        const storage = createStorage();
        const serializer = createSerializer();
        const service = new JsonStorageService(storage, serializer);
        vi.mocked(storage.readTextFile).mockResolvedValue(Result.Error("read failed"));

        await expect(service.load("missing.json")).resolves.toMatchObject({
            status: "Error",
            message: { key: "read failed" },
        });
        expect(serializer.deserialize).not.toHaveBeenCalled();

        vi.mocked(storage.readTextFile).mockResolvedValue(Result.Success("{bad"));
        vi.mocked(serializer.deserialize).mockReturnValue(Result.Error("parse failed"));

        await expect(service.load("bad.json")).resolves.toMatchObject({
            status: "Error",
            message: { key: "parse failed" },
        });
    });

    it("serializes and writes saved data", async () => {
        const storage = createStorage();
        const serializer = createSerializer<{ id: string }>();
        const options: StorageOptions = { baseDir: "AppConfig" };
        const service = new JsonStorageService(storage, serializer, options);
        vi.mocked(serializer.serialize).mockReturnValue(Result.Success('{"id":"project-a"}'));
        vi.mocked(storage.writeTextFile).mockResolvedValue(Result.Success());

        await expect(service.save("project.json", { id: "project-a" })).resolves.toMatchObject({
            status: "Success",
        });

        expect(serializer.serialize).toHaveBeenCalledWith({ id: "project-a" });
        expect(storage.writeTextFile).toHaveBeenCalledWith("project.json", '{"id":"project-a"}', options);
    });

    it("propagates serialize and write failures", async () => {
        const storage = createStorage();
        const serializer = createSerializer();
        const service = new JsonStorageService(storage, serializer);

        vi.mocked(serializer.serialize).mockReturnValue(Result.Error("serialize failed"));
        await expect(service.save("project.json", {})).resolves.toMatchObject({
            status: "Error",
            message: { key: "serialize failed" },
        });
        expect(storage.writeTextFile).not.toHaveBeenCalled();

        vi.mocked(serializer.serialize).mockReturnValue(Result.Success("{}"));
        vi.mocked(storage.writeTextFile).mockResolvedValue(Result.Error("write failed"));
        await expect(service.save("project.json", {})).resolves.toMatchObject({
            status: "Error",
            message: { key: "write failed" },
        });
    });

    it("serializes queued writes to the same path", async () => {
        const storage = createStorage();
        const serializer = createSerializer<{ value: number }>();
        const service = new JsonStorageService(storage, serializer);
        const calls: string[] = [];
        vi.mocked(serializer.serialize).mockImplementation((data) => Result.Success(JSON.stringify(data)));
        vi.mocked(storage.writeTextFile).mockImplementation(async (_path, content) => {
            calls.push(`start:${content}`);
            await Promise.resolve();
            calls.push(`end:${content}`);
            return Result.Success();
        });

        await Promise.all([
            service.save("same.json", { value: 1 }),
            service.save("same.json", { value: 2 }),
        ]);

        expect(calls).toEqual([
            'start:{"value":1}',
            'end:{"value":1}',
            'start:{"value":2}',
            'end:{"value":2}',
        ]);
    });

    it("delegates removal to the storage provider", async () => {
        const storage = createStorage();
        const options: StorageOptions = { baseDir: "AppData" };
        const service = new JsonStorageService(storage, createSerializer());
        vi.mocked(storage.removeFile).mockResolvedValue(Result.Success());

        await expect(service.remove("project.json", options)).resolves.toMatchObject({ status: "Success" });

        expect(storage.removeFile).toHaveBeenCalledWith("project.json", options);
    });
});
