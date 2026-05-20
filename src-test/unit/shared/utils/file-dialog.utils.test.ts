import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { open, save } from "@tauri-apps/plugin-dialog";

const dialogMock = vi.hoisted(() => ({
    open: vi.fn(),
    save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
    open: dialogMock.open,
    save: dialogMock.save,
}));

describe("FileDialogUtils", () => {
    beforeEach(() => {
        dialogMock.open.mockReset();
        dialogMock.save.mockReset();
    });

    it("normalizes a selected single file path", async () => {
        dialogMock.open.mockResolvedValue("C:\\Project\\Metk\\maps\\world.tm.json");

        await expect(FileDialogUtils.open({ multiple: false })).resolves.toBe("C:/Project/Metk/maps/world.tm.json");

        expect(open).toHaveBeenCalledWith({ multiple: false });
    });

    it("normalizes selected multiple file paths", async () => {
        dialogMock.open.mockResolvedValue([
            "C:\\Project\\Metk\\maps\\world.tm.json",
            "C:/Project/Metk/maps/../tilesets/terrain.ts.json",
        ]);

        await expect(FileDialogUtils.open({ multiple: true })).resolves.toEqual([
            "C:/Project/Metk/maps/world.tm.json",
            "C:/Project/Metk/tilesets/terrain.ts.json",
        ]);
    });

    it("returns null when open or save dialogs are cancelled", async () => {
        dialogMock.open.mockResolvedValue(null);
        dialogMock.save.mockResolvedValue(null);

        await expect(FileDialogUtils.open()).resolves.toBeNull();
        await expect(FileDialogUtils.saveFile()).resolves.toBeNull();
    });

    it("normalizes saved file paths", async () => {
        dialogMock.save.mockResolvedValue("C:\\Project\\Metk\\exports\\world.tmx");

        await expect(FileDialogUtils.saveFile({ title: "Export" })).resolves.toBe("C:/Project/Metk/exports/world.tmx");

        expect(save).toHaveBeenCalledWith({ title: "Export" });
    });
});
