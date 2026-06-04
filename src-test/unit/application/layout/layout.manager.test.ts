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

const compactDefaultLayout = {
    version: 1,
    layout: {
        type: "row",
        children: [
            {
                type: "col",
                weight: 25,
                children: [
                    {
                        type: "tabset",
                        weight: 50,
                        children: [
                            { type: "tab", id: "tilesetView" },
                            { type: "tab", id: "rulesetManager" },
                            { type: "tab", id: "entityCollectionManager" },
                        ],
                    },
                    {
                        type: "tabset",
                        weight: 50,
                        children: [{ type: "tab", id: "layerManager" }],
                    },
                ],
            },
            {
                type: "tabset",
                id: "mainEditorTabset",
                weight: 80,
                children: [{ type: "tab", id: "tilemapEditor" }],
            },
            {
                type: "tabset",
                weight: 25,
                children: [{ type: "tab", id: "properties" }],
            },
        ],
    },
};

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
        expect(storageMock.save).toHaveBeenCalledWith("C:/Project/Metk/sample/.metk/layout.json", compactDefaultLayout);
        expect(manager.layoutData).toEqual(workspaceLayout);
        expect(onLayoutLoaded).toHaveBeenCalledWith(expect.objectContaining({ layout: workspaceLayout.layout }));
    });

    it("hydrates saved compact layout when loading succeeds", async () => {
        const savedLayout = {
            version: 1,
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        id: "mainEditorTabset",
                        weight: 33,
                        active: true,
                        children: [{ type: "tab", id: "tilemapEditor" }],
                    },
                ],
            },
        };
        const manager = new LayoutManager();
        storageMock.exists.mockResolvedValue(true);
        storageMock.load.mockResolvedValue(Result.Success(savedLayout));

        await expect(manager.loadLayout(createProject() as any)).resolves.toEqual({
            status: "Success",
            data: expect.objectContaining({
                global: workspaceLayout.global,
                layout: {
                    type: "row",
                    children: [
                        {
                            type: "tabset",
                            id: "mainEditorTabset",
                            weight: 33,
                            active: true,
                            enableDrag: false,
                            enableDrop: false,
                            enableMaximize: false,
                            enableTabStrip: false,
                            children: [
                                expect.objectContaining({
                                    id: "tilemapEditor",
                                    name: "TilemapEditor",
                                    component: "tilemapEditor",
                                    enableClose: false,
                                    minWidth: 400,
                                    minHeight: 400,
                                }),
                            ],
                        },
                    ],
                },
            }),
        });

        expect(manager.layoutData).toEqual(expect.objectContaining({ global: workspaceLayout.global }));
        expect(storageMock.save).not.toHaveBeenCalled();
    });

    it("falls back to workspace layout when saved data is legacy-like full FlexLayout data", async () => {
        const legacyLikeLayout = {
            global: { splitterSize: 999 },
            borders: [{ type: "border", location: "left", children: [{ type: "tab", id: "stale", component: "stale" }] }],
            popouts: { stale: { layout: { type: "row", children: [] }, rect: { x: 0, y: 0, width: 1, height: 1 } } },
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        enableDrop: true,
                        children: [
                            {
                                type: "tab",
                                id: "#generated",
                                name: "Stale",
                                component: "properties",
                                minWidth: 1,
                            },
                        ],
                    },
                ],
            },
        };
        const manager = new LayoutManager();
        storageMock.exists.mockResolvedValue(true);
        storageMock.load.mockResolvedValue(Result.Success(legacyLikeLayout));

        await manager.loadLayout(createProject() as any);

        expect(manager.layoutData).toEqual(workspaceLayout);
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

        expect(manager.layoutData).toEqual(workspaceLayout);
        expect(storageMock.save).toHaveBeenCalledWith("C:/Project/Metk/sample/.metk/layout.json", compactDefaultLayout);
    });

    it("updates in-memory layout and debounces saves", async () => {
        const manager = new LayoutManager();
        const project = createProject();
        storageMock.exists.mockResolvedValue(false);

        await manager.loadLayout(project as any);
        storageMock.save.mockClear();

        const firstLayout = {
            layout: {
                type: "row",
                children: [{ type: "tabset", children: [{ type: "tab", id: "tilesetView", component: "tilesetView", name: "Tilesets" }] }],
            },
        };
        const secondLayout = {
            global: { splitterSize: 999 },
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        enableDrop: true,
                        children: [
                            {
                                type: "tab",
                                id: "properties",
                                component: "stale-component",
                                name: "Stale Properties",
                                minWidth: 1,
                            },
                        ],
                    },
                ],
            },
        };

        manager.updateLayout(firstLayout as any);
        manager.updateLayout(secondLayout as any);

        expect(manager.layoutData).toBe(secondLayout);
        expect(storageMock.save).not.toHaveBeenCalled();

        vi.advanceTimersByTime(499);
        expect(storageMock.save).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        await Promise.resolve();

        expect(storageMock.save).toHaveBeenCalledTimes(1);
        expect(storageMock.save).toHaveBeenCalledWith("C:/Project/Metk/sample/.metk/layout.json", {
            version: 1,
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        children: [{ type: "tab", id: "properties" }],
                    },
                ],
            },
        });
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
