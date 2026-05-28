import { beforeEach, describe, expect, it, vi } from "vitest";

const kernelState = vi.hoisted(() => ({
    appKernel: {
        editorFacade: null as any,
        workspaceManager: {
            currentWorkspace: null as any,
        },
    },
}));

vi.mock("@/application/bootstrap/app-kernel", () => ({
    appKernel: kernelState.appKernel,
}));

import { CreateGroupLayerCommand } from "@/application/commands/layer/create-group-layer.command";
import { CreateRuleLayerCommand } from "@/application/commands/layer/create-rule-layer.command";
import { CreateTileLayerCommand } from "@/application/commands/layer/create-tile-layer.command";
import { DeleteLayerCommand } from "@/application/commands/layer/delete-layer.command";
import { DuplicateLayerCommand } from "@/application/commands/layer/duplicate-layer.command";
import { MoveLayerCommand } from "@/application/commands/layer/move-layer.command";
import { UpdatePropertyCommand } from "@/application/commands/update-property.command";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EditorFacade } from "@/application/editor.facade";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { useLayerManagerStore } from "@/ui/stores/layer-manager.store";
import { TilemapLayerService } from "@/shared/services/tilemap-layer.service";
import { WorkspaceService } from "@/shared/services/workspace.service";

import {
    createTilemap,
    layerIds,
    requireGroupLayer,
} from "../../application/commands/layer/layer-command-test-utils";

const resetLayerManagerStore = () => {
    useLayerManagerStore.setState(useLayerManagerStore.getInitialState(), true);
};

const createServiceHarness = (selectedLayers: string[] = []) => {
    const tilemap = createTilemap();
    const objectRegistry = new EditorObjectRegistry();
    objectRegistry.registerTree(tilemap);
    const session = {
        tilemap,
        isDirty: false,
        layerState: { selectedLayers: [...selectedLayers] },
        markLayerChange: vi.fn(() => {
            session.isDirty = true;
        }),
        emit: vi.fn(),
        updateLayerState: vi.fn((state: { selectedLayers?: string[] }) => {
            session.layerState = { ...session.layerState, ...state };
        }),
    };
    const tilemapSessionManager = {
        activeSession: session,
        getSessionByTilemapId: vi.fn((tilemapId: string) => tilemapId === tilemap.id ? session : null),
    };

    const editorFacade = {
        getActiveTilemapSession: vi.fn(() => session),
        getCurrentHistoryManager: vi.fn(),
        objectRegistry,
        currentWorkspace: { tilemapSessionManager },
    } as unknown as EditorFacade;

    const executedCommands: IUndoableCommand[] = [];
    const historyManager = {
        startTransaction: vi.fn(),
        execute: vi.fn((command: IUndoableCommand, facade: EditorFacade) => {
            executedCommands.push(command);
            return command.execute(facade);
        }),
        commitTransaction: vi.fn(),
    };

    (editorFacade.getCurrentHistoryManager as any).mockReturnValue(historyManager);
    kernelState.appKernel.editorFacade = editorFacade;
    kernelState.appKernel.workspaceManager.currentWorkspace = {
        tilemapSessionManager,
    };

    return {
        tilemap,
        root: tilemap.rootLayer,
        session,
        editorFacade,
        historyManager,
        executedCommands,
    };
};

const expectSingleTransaction = (
    historyManager: ReturnType<typeof createServiceHarness>["historyManager"],
    commandCount: number,
) => {
    expect(historyManager.startTransaction).toHaveBeenCalledTimes(1);
    expect(historyManager.execute).toHaveBeenCalledTimes(commandCount);
    expect(historyManager.commitTransaction).toHaveBeenCalledTimes(1);
};

describe("TilemapLayerService.getSelectedParentLayer", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("returns the most recently selected group layer from the layer manager store", () => {
        const { tilemap } = createServiceHarness();
        useLayerManagerStore.getState().setSelectedLayer(["group-a", "tile-root", "group-b"]);

        expect(TilemapLayerService.getSelectedParentLayer(tilemap)?.id).toBe("group-b");
    });

    it("returns null when the current store selection has no group layers", () => {
        const { tilemap } = createServiceHarness();
        useLayerManagerStore.getState().setSelectedLayer(["tile-a", "tile-root"]);

        expect(TilemapLayerService.getSelectedParentLayer(tilemap)).toBeNull();
    });
});

describe("TilemapLayerService layer creation", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("creates a tile layer under the selected group parent through one history transaction", async () => {
        const { root, historyManager } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");
        useLayerManagerStore.getState().setSelectedLayer(["group-a"]);

        await TilemapLayerService.createNewTileLayer();

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(CreateTileLayerCommand);
        const editingId = useLayerManagerStore.getState().editingId;
        expect(editingId).toEqual(expect.any(String));
        expect(root.findLayer(editingId!)?.parentLayer.id).toBe("group-a");
        expect(root.findLayer(editingId!)?.serialize()).toMatchObject({
            type: "tile",
            width: 4,
            height: 4,
        });
        expect(layerIds(group)[0]).toBe(editingId);
    });

    it("creates a rule layer under the selected group parent through one history transaction", async () => {
        const { root, historyManager } = createServiceHarness();
        useLayerManagerStore.getState().setSelectedLayer(["group-a"]);

        await TilemapLayerService.createNewRuleLayer();

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(CreateRuleLayerCommand);
        const editingId = useLayerManagerStore.getState().editingId;
        expect(root.findLayer(editingId!)?.parentLayer.id).toBe("group-a");
        expect(root.findLayer(editingId!)?.serialize()).toMatchObject({
            type: "auto_rule",
            width: 4,
            height: 4,
        });
    });

    it("creates a group layer under root when no selected group parent exists", async () => {
        const { root, historyManager } = createServiceHarness();
        useLayerManagerStore.getState().setSelectedLayer(["tile-root"]);

        await TilemapLayerService.createNewGroupLayer();

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(CreateGroupLayerCommand);
        const editingId = useLayerManagerStore.getState().editingId;
        expect(root.findLayer(editingId!)?.parentLayer.id).toBe("root");
        expect(layerIds(root)[0]).toBe(editingId);
    });
});

describe("TilemapLayerService duplicate and delete workflows", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("duplicates every selected layer inside a single history transaction", async () => {
        const { root, historyManager } = createServiceHarness(["tile-a", "tile-root"]);
        const group = requireGroupLayer(root, "group-a");

        await TilemapLayerService.duplicateLayer();

        expectSingleTransaction(historyManager, 2);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(DuplicateLayerCommand);
        expect(historyManager.execute.mock.calls[1][0]).toBeInstanceOf(DuplicateLayerCommand);
        expect(layerIds(group)).toHaveLength(3);
        expect(layerIds(root)).toHaveLength(5);
        expect(group.layers[2].name).toBe("Ground (copy)");
        expect(root.layers[3].name).toBe("Root Tile (copy)");
    });

    it("deletes selected layers and prunes deleted or missing ids from session selection", async () => {
        const { root, session, historyManager } = createServiceHarness(["tile-a", "missing-layer"]);
        const group = requireGroupLayer(root, "group-a");

        await TilemapLayerService.deleteLayer();

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(DeleteLayerCommand);
        expect(root.findLayer("tile-a")).toBeNull();
        expect(layerIds(group)).toEqual(["group-child"]);
        expect(session.updateLayerState).toHaveBeenCalledWith({ selectedLayers: [] });
        expect(session.layerState.selectedLayers).toEqual([]);
    });
});

describe("TilemapLayerService selection workflows", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
        vi.spyOn(WorkspaceService, "saveCurrentWorkspace").mockResolvedValue(undefined);
    });

    it("selects one layer, toggles multi-selection, and saves workspace state", () => {
        const { session } = createServiceHarness(["tile-root"]);

        TilemapLayerService.selectLayer("tile-a", false);
        expect(session.layerState.selectedLayers).toEqual(["tile-a"]);

        TilemapLayerService.selectLayer("group-a", true);
        expect(session.layerState.selectedLayers).toEqual(["tile-a", "group-a"]);

        TilemapLayerService.selectLayer("tile-a", true);
        expect(session.layerState.selectedLayers).toEqual(["group-a"]);
        expect(WorkspaceService.saveCurrentWorkspace).toHaveBeenCalledTimes(3);
        expect(WorkspaceService.saveCurrentWorkspace).toHaveBeenLastCalledWith({ waitForTimeout: false });
    });

    it("selects all layers and clears all selection using the active session", () => {
        const { root, session } = createServiceHarness(["tile-root"]);

        TilemapLayerService.selectAllLayers();
        expect(session.layerState.selectedLayers).toEqual(Array.from(root.getAllIds()));

        TilemapLayerService.deselectAllLayers();
        expect(session.layerState.selectedLayers).toEqual([]);
        expect(WorkspaceService.saveCurrentWorkspace).toHaveBeenCalledTimes(2);
    });
});

describe("TilemapLayerService visibility workflows", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("toggles selected layers visibility through history", () => {
        const { root, historyManager } = createServiceHarness(["tile-root"]);

        TilemapLayerService.toggleSelectedLayersVisibility();

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(UpdatePropertyCommand);
        expect(historyManager.execute.mock.calls[0][0]).toMatchObject({ propertyKey: "_visible" });
        expect(root.findLayer("tile-root")?.visible).toBe(false);
    });

    it("toggles non-selected layers visibility and leaves selected layers untouched", () => {
        const { root, historyManager } = createServiceHarness(["tile-root"]);

        TilemapLayerService.toggleNonSelectedLayersVisibility();

        expectSingleTransaction(historyManager, root.getAllIds().size - 1);
        expect(root.findLayer("tile-root")?.visible).toBe(true);
        expect(root.findLayer("group-b")?.visible).toBe(false);
    });

    it("toggles explicit layer ids while ignoring missing ids", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.toggleVisibility(["tile-root", "missing-layer"], false);

        expectSingleTransaction(historyManager, 1);
        expect(root.findLayer("tile-root")?.visible).toBe(false);
    });

    it("toggles raw visibility instead of inherited effective visibility", () => {
        const { root } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");
        const child = root.findLayer("tile-a")!;
        const childVisibleProperty = child.properties.get("_visible")!;

        TilemapLayerService.toggleVisibility(["group-a"], false);
        expect(group.visible).toBe(false);
        expect(child.visible).toBe(false);
        expect(childVisibleProperty.getter()).toBe(true);

        TilemapLayerService.toggleVisibility(["tile-a"]);

        expect(child.visible).toBe(false);
        expect(childVisibleProperty.getter()).toBe(false);
    });
});

describe("TilemapLayerService lock workflows", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("toggles selected layers lock through history", () => {
        const { root, historyManager } = createServiceHarness(["tile-root"]);

        TilemapLayerService.toggleSelectedLayersLock();

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(UpdatePropertyCommand);
        expect(historyManager.execute.mock.calls[0][0]).toMatchObject({ propertyKey: "_locked" });
        expect(root.findLayer("tile-root")?.locked).toBe(true);
    });

    it("toggles non-selected layers lock and leaves selected layers untouched", () => {
        const { root, historyManager } = createServiceHarness(["tile-root"]);

        TilemapLayerService.toggleNonSelectedLayersLock();

        expectSingleTransaction(historyManager, root.getAllIds().size - 1);
        expect(root.findLayer("tile-root")?.locked).toBe(false);
        expect(root.findLayer("group-b")?.locked).toBe(true);
    });

    it("toggles explicit layer ids while ignoring missing ids", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.toggleLock(["tile-root", "missing-layer"], true);

        expectSingleTransaction(historyManager, 1);
        expect(root.findLayer("tile-root")?.locked).toBe(true);
    });

    it("toggles raw lock state instead of inherited effective lock state", () => {
        const { root } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");
        const child = root.findLayer("tile-a")!;
        const childLockedProperty = child.properties.get("_locked")!;

        TilemapLayerService.toggleLock(["group-a"], true);
        expect(group.locked).toBe(true);
        expect(child.locked).toBe(true);
        expect(childLockedProperty.getter()).toBe(false);

        TilemapLayerService.toggleLock(["tile-a"]);

        expect(child.locked).toBe(true);
        expect(childLockedProperty.getter()).toBe(true);
    });
});

describe("TilemapLayerService.toggleOpenGroupLayer", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("opens a group layer directly without recording an undoable history command", () => {
        const { root, historyManager } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");

        TilemapLayerService.toggleOpenGroupLayer("group-a", true);

        expect(group.isOpen).toBe(true);
        expect(group.properties.get("isOpen")?.getter()).toBe(true);
        expect(historyManager.execute).not.toHaveBeenCalled();
        expect(historyManager.startTransaction).not.toHaveBeenCalled();
    });

    it("does nothing when the requested layer is missing or not a group", () => {
        const { root, historyManager } = createServiceHarness();
        const before = root.serialize();

        TilemapLayerService.toggleOpenGroupLayer("tile-root", true);
        TilemapLayerService.toggleOpenGroupLayer("missing-layer", true);

        expect(root.serialize()).toEqual(before);
        expect(historyManager.execute).not.toHaveBeenCalled();
    });
});

describe("TilemapLayerService.moveLayers", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("moves dragged layers inside a group target through one history transaction", () => {
        const { root, historyManager } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");

        TilemapLayerService.moveLayers(["tile-root"], "group-a", "inside");

        expectSingleTransaction(historyManager, 1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(MoveLayerCommand);
        expect(layerIds(group)).toEqual(["group-child", "tile-a", "tile-root"]);
        expect(root.findLayer("tile-root")?.parentLayer.id).toBe("group-a");
    });

    it("moves dragged layers above and below a target in the target parent", () => {
        const topHarness = createServiceHarness();
        TilemapLayerService.moveLayers(["tile-root"], "group-b", "top");
        expectSingleTransaction(topHarness.historyManager, 1);
        expect(layerIds(topHarness.root)).toEqual(["group-a", "tile-root", "group-b", "rule-root"]);

        const bottomHarness = createServiceHarness();
        TilemapLayerService.moveLayers(["rule-root"], "group-b", "bottom");
        expectSingleTransaction(bottomHarness.historyManager, 1);
        expect(layerIds(bottomHarness.root)).toEqual(["group-a", "group-b", "rule-root", "tile-root"]);
    });

    it("moves a same-parent layer downward without overshooting the target", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.moveLayers(["group-a"], "group-b", "bottom");

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-b", "group-a", "tile-root", "rule-root"]);
    });

    it("moves a same-parent layer upward to the correct target position", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.moveLayers(["tile-root"], "group-a", "top");

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["tile-root", "group-a", "group-b", "rule-root"]);
    });

    it("moves multiple sibling layers below a target while preserving their visual order", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.moveLayers(["group-b", "group-a"], "tile-root", "bottom");

        expectSingleTransaction(historyManager, 2);
        expect(layerIds(root)).toEqual(["tile-root", "group-a", "group-b", "rule-root"]);
    });

    it("moves multiple sibling layers above a target while preserving their visual order", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.moveLayers(["rule-root", "tile-root"], "group-a", "top");

        expectSingleTransaction(historyManager, 2);
        expect(layerIds(root)).toEqual(["tile-root", "rule-root", "group-a", "group-b"]);
    });

    it("moves multiple layers inside a group while preserving their visual order", () => {
        const { root, historyManager } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");

        TilemapLayerService.moveLayers(["rule-root", "tile-root"], "group-a", "inside");

        expectSingleTransaction(historyManager, 2);
        expect(layerIds(group)).toEqual(["group-child", "tile-a", "tile-root", "rule-root"]);
        expect(root.findLayer("tile-root")?.parentLayer.id).toBe("group-a");
        expect(root.findLayer("rule-root")?.parentLayer.id).toBe("group-a");
    });

    it("moves an ancestor once and leaves selected descendants attached to it", () => {
        const { root, historyManager } = createServiceHarness();
        const group = requireGroupLayer(root, "group-a");

        TilemapLayerService.moveLayers(["group-a", "tile-a"], "group-b", "bottom");

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-b", "group-a", "tile-root", "rule-root"]);
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("group-a");
    });

    it("rejects self moves before opening a history transaction", () => {
        const { root, historyManager } = createServiceHarness();
        const before = root.serialize();

        TilemapLayerService.moveLayers(["group-a"], "group-a", "inside");

        expect(root.serialize()).toEqual(before);
        expect(historyManager.startTransaction).not.toHaveBeenCalled();
        expect(historyManager.execute).not.toHaveBeenCalled();
    });

    it("rejects moving an ancestor into its descendant before opening a history transaction", () => {
        const { root, historyManager } = createServiceHarness();
        const before = root.serialize();

        TilemapLayerService.moveLayers(["group-a"], "group-child", "inside");

        expect(root.serialize()).toEqual(before);
        expect(historyManager.startTransaction).not.toHaveBeenCalled();
        expect(historyManager.execute).not.toHaveBeenCalled();
    });

    it("ignores missing dragged layers and missing targets without opening invalid transactions", () => {
        const missingDragHarness = createServiceHarness();

        TilemapLayerService.moveLayers(["missing-layer"], "group-a", "inside");

        expect(missingDragHarness.historyManager.startTransaction).not.toHaveBeenCalled();
        expect(missingDragHarness.historyManager.execute).not.toHaveBeenCalled();

        const missingTargetHarness = createServiceHarness();

        TilemapLayerService.moveLayers(["tile-root"], "missing-target", "inside");

        expect(missingTargetHarness.historyManager.startTransaction).not.toHaveBeenCalled();
        expect(missingTargetHarness.historyManager.execute).not.toHaveBeenCalled();
    });
});

describe("TilemapLayerService.moveLayersUp", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("moves a selected layer above a normal sibling", () => {
        const { root, historyManager } = createServiceHarness(["rule-root"]);

        TilemapLayerService.moveLayersUp();

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-a", "group-b", "rule-root", "tile-root"]);
    });

    it("moves a selected layer into the previous group sibling", () => {
        const { root, historyManager } = createServiceHarness(["tile-root"]);
        const group = requireGroupLayer(root, "group-b");

        TilemapLayerService.moveLayersUp();

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-a", "group-b", "rule-root"]);
        expect(layerIds(group)).toEqual(["tile-root"]);
    });

    it("moves the first child in a group out above its parent", () => {
        const { root, historyManager } = createServiceHarness(["group-child"]);

        TilemapLayerService.moveLayersUp();

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-child", "group-a", "group-b", "tile-root", "rule-root"]);
        expect(root.findLayer("group-child")?.parentLayer.id).toBe("root");
    });

    it("does not execute a move when the topmost root layer is selected", () => {
        const { root, historyManager } = createServiceHarness(["group-a"]);
        const before = root.serialize();

        TilemapLayerService.moveLayersUp();

        expect(root.serialize()).toEqual(before);
        expect(historyManager.execute).not.toHaveBeenCalled();
    });

    it("does not move a mixed-parent selection", () => {
        const { root, historyManager } = createServiceHarness(["tile-a", "tile-root"]);
        const before = root.serialize();

        TilemapLayerService.moveLayersUp();

        expect(root.serialize()).toEqual(before);
        expect(historyManager.startTransaction).not.toHaveBeenCalled();
    });
});

describe("TilemapLayerService.moveLayersDown", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("moves a selected layer below a normal sibling", () => {
        const { root, historyManager } = createServiceHarness(["group-b"]);

        TilemapLayerService.moveLayersDown();

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-a", "tile-root", "group-b", "rule-root"]);
    });

    it("moves a selected layer into the next group sibling", () => {
        const { root, historyManager } = createServiceHarness(["group-a"]);
        const group = requireGroupLayer(root, "group-b");

        TilemapLayerService.moveLayersDown();

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-b", "tile-root", "rule-root"]);
        expect(layerIds(group)).toEqual(["group-a"]);
    });

    it("moves the last child in a group out below its parent", () => {
        const { root, historyManager } = createServiceHarness(["tile-a"]);

        TilemapLayerService.moveLayersDown();

        expectSingleTransaction(historyManager, 1);
        expect(layerIds(root)).toEqual(["group-a", "tile-a", "group-b", "tile-root", "rule-root"]);
        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("root");
    });

    it("does not execute a move when the bottommost root layer is selected", () => {
        const { root, historyManager } = createServiceHarness(["rule-root"]);
        const before = root.serialize();

        TilemapLayerService.moveLayersDown();

        expect(root.serialize()).toEqual(before);
        expect(historyManager.execute).not.toHaveBeenCalled();
    });
});

describe("TilemapLayerService.renameLayer", () => {
    beforeEach(() => {
        resetLayerManagerStore();
        vi.restoreAllMocks();
    });

    it("records rename through history when undo recording is enabled", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.renameLayer("tile-root", "Collision", true);

        expect(historyManager.execute).toHaveBeenCalledTimes(1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(UpdatePropertyCommand);
        expect(historyManager.execute.mock.calls[0][0]).toMatchObject({ propertyKey: "name" });
        expect(historyManager.startTransaction).not.toHaveBeenCalled();
        expect(root.findLayer("tile-root")?.name).toBe("Collision");
    });

    it("renames directly without history when undo recording is disabled", () => {
        const { root, historyManager } = createServiceHarness();

        TilemapLayerService.renameLayer("tile-root", "Draft Name", false);

        expect(historyManager.execute).not.toHaveBeenCalled();
        expect(root.findLayer("tile-root")?.name).toBe("Draft Name");
    });

    it("leaves the layer tree unchanged when directly renaming a missing layer", () => {
        const { root, historyManager } = createServiceHarness();
        const before = root.serialize();

        TilemapLayerService.renameLayer("missing-layer", "Draft Name", false);

        expect(root.serialize()).toEqual(before);
        expect(historyManager.execute).not.toHaveBeenCalled();
    });
});
