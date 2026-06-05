import { beforeEach, describe, expect, it, vi } from "vitest";

import { TauriFileDialogService } from "@/infrastructure/tauri-file-dialog.service";
import { open, save } from "@tauri-apps/plugin-dialog";

const dialogMock = vi.hoisted(() => ({
    open: vi.fn(),
    save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
    open: dialogMock.open,
    save: dialogMock.save,
}));

describe("TauriFileDialogService", () => {
    beforeEach(() => {
        dialogMock.open.mockReset();
        dialogMock.save.mockReset();
    });

    it("normalizes a selected single file path", async () => {
        dialogMock.open.mockResolvedValue("C:\\Project\\Metk\\maps\\world.tm.json");
        const service = new TauriFileDialogService();

        await expect(service.open({ multiple: false })).resolves.toBe("C:/Project/Metk/maps/world.tm.json");

        expect(open).toHaveBeenCalledWith({ multiple: false });
    });

    it("normalizes selected multiple file paths", async () => {
        dialogMock.open.mockResolvedValue([
            "C:\\Project\\Metk\\maps\\world.tm.json",
            "C:/Project/Metk/maps/../tilesets/terrain.ts.json",
        ]);
        const service = new TauriFileDialogService();

        await expect(service.open({ multiple: true })).resolves.toEqual([
            "C:/Project/Metk/maps/world.tm.json",
            "C:/Project/Metk/tilesets/terrain.ts.json",
        ]);
    });

    it("returns null when open or save dialogs are cancelled", async () => {
        dialogMock.open.mockResolvedValue(null);
        dialogMock.save.mockResolvedValue(null);
        const service = new TauriFileDialogService();

        await expect(service.open()).resolves.toBeNull();
        await expect(service.saveFile()).resolves.toBeNull();
    });

    it("normalizes saved file paths", async () => {
        dialogMock.save.mockResolvedValue("C:\\Project\\Metk\\exports\\world.tmx");
        const service = new TauriFileDialogService();

        await expect(service.saveFile({ title: "Export" })).resolves.toBe("C:/Project/Metk/exports/world.tmx");

        expect(save).toHaveBeenCalledWith({ title: "Export" });
    });
});
