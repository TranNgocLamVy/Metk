import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportStorageService } from "@/infrastructure/export-storage.service";
import { create, exists, writeFile } from "@tauri-apps/plugin-fs";

const fsMock = vi.hoisted(() => ({
    exists: vi.fn(),
    writeFile: vi.fn(),
    create: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
    exists: fsMock.exists,
    writeFile: fsMock.writeFile,
    create: fsMock.create,
}));

describe("ExportStorageService", () => {
    beforeEach(() => {
        fsMock.exists.mockReset();
        fsMock.writeFile.mockReset();
        fsMock.create.mockReset();
    });

    it("writes directly when the export file already exists", async () => {
        const buffer = new Uint8Array([1, 2, 3]);
        fsMock.exists.mockResolvedValue(true);
        fsMock.writeFile.mockResolvedValue(undefined);

        await expect(new ExportStorageService().exportToPath("C:/exports/map.tmx", buffer)).resolves.toMatchObject({
            status: "Success",
        });

        expect(exists).toHaveBeenCalledWith("C:/exports/map.tmx");
        expect(writeFile).toHaveBeenCalledWith("C:/exports/map.tmx", buffer);
        expect(create).not.toHaveBeenCalled();
    });

    it("creates, writes, and closes a new export file", async () => {
        const buffer = new Uint8Array([4, 5, 6]);
        const file = {
            write: vi.fn(),
            close: vi.fn(),
        };
        fsMock.exists.mockResolvedValue(false);
        fsMock.create.mockResolvedValue(file);

        await expect(new ExportStorageService().exportToPath("C:/exports/new-map.tmx", buffer)).resolves.toMatchObject({
            status: "Success",
        });

        expect(create).toHaveBeenCalledWith("C:/exports/new-map.tmx");
        expect(file.write).toHaveBeenCalledWith(buffer);
        expect(file.close).toHaveBeenCalledTimes(1);
        expect(writeFile).not.toHaveBeenCalled();
    });

    it("propagates filesystem failures", async () => {
        fsMock.exists.mockRejectedValue(new Error("permission denied"));

        await expect(new ExportStorageService().exportToPath("C:/exports/map.tmx", new Uint8Array())).rejects.toThrow("permission denied");
    });
});
