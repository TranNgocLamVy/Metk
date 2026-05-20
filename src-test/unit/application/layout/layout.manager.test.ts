import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LayoutManager } from "@/application/layout/layout.manager";
import { LayoutStorageService } from "@/infrastructure/container";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import { Result } from "@/shared/types/result";

const storageMock = vi.hoisted(() => ({
    exists: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
}));

vi.mock("@/infrastructure/container", () => ({
    LayoutStorageService: storageMock,
}));

const createProject = () => ({
    projectPathSystem: {
        getAbsPathFromRelPath: vi.fn((relPath: string) => `C:/Project/Metk/sample/${relPath}`),
    },
});

describe("LayoutManager", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        storageMock.exists.mockReset();
        storageMock.load.mockReset();
        storageMock.save.mockReset().mockResolvedValue(Result.Success());
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("loads and saves the default layout when no saved layout exists", async () => {
        const project = createProject();
        const manager = new LayoutManager();
        const onLayoutLoaded = vi.fn();
        manager.on("onLayoutLoaded", onLayoutLoaded);
        storageMock.exists.mockResolvedValue(false);

        await expect(manager.loadLayout(project as any)).resolves.toEqual({
            status: "Success",
            data: workspaceLayout,
        });

        expect(project.projectPathSystem.getAbsPathFromRelPath).toHaveBeenCalledWith(".metk/layout.json");
        expect(storageMock.save).toHaveBeenCalledWith("C:/Project/Metk/sample/.metk/layout.json", workspaceLayout);
        expect(manager.layoutData).toBe(workspaceLayout);
        expect(onLayoutLoaded).toHaveBeenCalledWith(workspaceLayout);
    });

    it("restores saved layout when loading succeeds", async () => {
        const savedLayout = { global: {}, layout: { type: "row", children: [] } };
        const manager = new LayoutManager();
        storageMock.exists.mockResolvedValue(true);
        storageMock.load.mockResolvedValue(Result.Success(savedLayout));

        await expect(manager.loadLayout(createProject() as any)).resolves.toEqual({
            status: "Success",
            data: savedLayout,
        });

        expect(manager.layoutData).toBe(savedLayout);
        expect(storageMock.save).not.toHaveBeenCalled();
    });

    it("falls back to default layout and saves when saved layout load fails", async () => {
        const manager = new LayoutManager();
        storageMock.exists.mockResolvedValue(true);
        storageMock.load.mockResolvedValue(Result.Error("load failed"));

        await expect(manager.loadLayout(createProject() as any)).resolves.toEqual({
            status: "Success",
            data: workspaceLayout,
        });

        expect(manager.layoutData).toBe(workspaceLayout);
        expect(storageMock.save).toHaveBeenCalledWith("C:/Project/Metk/sample/.metk/layout.json", workspaceLayout);
    });

    it("updates in-memory layout and debounces saves", async () => {
        const manager = new LayoutManager();
        const project = createProject();
        storageMock.exists.mockResolvedValue(false);

        await manager.loadLayout(project as any);
        storageMock.save.mockClear();

        const firstLayout = { layout: { type: "row", children: [{ type: "tab", component: "a" }] } };
        const secondLayout = { layout: { type: "row", children: [{ type: "tab", component: "b" }] } };

        manager.updateLayout(firstLayout as any);
        manager.updateLayout(secondLayout as any);

        expect(manager.layoutData).toBe(secondLayout);
        expect(storageMock.save).not.toHaveBeenCalled();

        vi.advanceTimersByTime(499);
        expect(storageMock.save).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        await Promise.resolve();

        expect(storageMock.save).toHaveBeenCalledTimes(1);
        expect(storageMock.save).toHaveBeenCalledWith("C:/Project/Metk/sample/.metk/layout.json", secondLayout);
    });

    it("unloads layout, cancels pending saves, and emits unload event", async () => {
        const manager = new LayoutManager();
        const onLayoutUnloaded = vi.fn();
        manager.on("onLayoutUnloaded", onLayoutUnloaded);
        storageMock.exists.mockResolvedValue(false);
        await manager.loadLayout(createProject() as any);
        storageMock.save.mockClear();

        manager.updateLayout({ layout: { type: "row", children: [] } } as any);
        manager.unloadLayout();
        vi.advanceTimersByTime(500);
        await Promise.resolve();

        expect(manager.layoutData).toBeNull();
        expect(storageMock.save).not.toHaveBeenCalled();
        expect(onLayoutUnloaded).toHaveBeenCalledTimes(1);
    });

    it("gracefully skips unload when no project is loaded", () => {
        const manager = new LayoutManager();
        const onLayoutUnloaded = vi.fn();
        manager.on("onLayoutUnloaded", onLayoutUnloaded);

        manager.unloadLayout();

        expect(manager.layoutData).toBeNull();
        expect(onLayoutUnloaded).not.toHaveBeenCalled();
    });
});
