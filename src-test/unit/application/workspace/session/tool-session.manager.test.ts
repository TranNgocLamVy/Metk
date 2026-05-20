import { describe, expect, it, vi } from "vitest";

import { ToolSessionManager } from "@/application/workspace/session/tool-session.manager";

import { createEditorFacadeHarness } from "./session-manager-test-utils";

describe("ToolSessionManager", () => {
    it("loads the saved current tool and registers for tool change events", async () => {
        const { editorFacade, toolManager } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ currentTool: "stamp" }, editorFacade);

        await manager.load();

        expect(toolManager.startTool).toHaveBeenCalledWith("stamp");
        expect(toolManager.on).toHaveBeenCalledWith("onToolChanged", expect.any(Function));
        expect(manager.serialize()).toEqual({ currentTool: "stamp" });
    });

    it("does not start a tool when no saved current tool exists", async () => {
        const { editorFacade, toolManager } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ currentTool: null }, editorFacade);

        await manager.load();

        expect(toolManager.startTool).not.toHaveBeenCalled();
        expect(toolManager.on).toHaveBeenCalledWith("onToolChanged", expect.any(Function));
    });

    it("updates serialized state and saves the workspace when the current tool changes", async () => {
        const { editorFacade, toolManager, workspaceManager } = createEditorFacadeHarness();
        let onToolChanged: (() => void) | undefined;
        (toolManager.on as any).mockImplementation((_eventName: string, listener: () => void) => {
            onToolChanged = listener;
        });
        (toolManager.getCurrentToolId as any).mockReturnValue("bucket");
        const manager = new ToolSessionManager({ currentTool: "stamp" }, editorFacade);

        await manager.load();
        await onToolChanged!();

        expect(manager.serialize()).toEqual({ currentTool: "bucket" });
        expect(workspaceManager.saveCurrentWorkspace).toHaveBeenCalledTimes(1);
    });

    it("serializes undefined currentTool when the active tool is cleared", async () => {
        const { editorFacade, toolManager } = createEditorFacadeHarness();
        (toolManager.getCurrentToolId as any).mockReturnValue(null);
        const manager = new ToolSessionManager({ currentTool: "stamp" }, editorFacade);

        await manager.onToolChange();

        expect(manager.serialize()).toEqual({ currentTool: undefined });
    });

    it("updates state directly and unregisters the tool-change listener on destroy", async () => {
        const { editorFacade, toolManager } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ currentTool: "stamp" }, editorFacade);

        await manager.load();
        const registeredListener = (toolManager.on as any).mock.calls[0][1];
        await manager.updateToolState({ currentTool: "eraser" });
        await manager.destroy();

        expect(manager.serialize()).toEqual({ currentTool: "eraser" });
        expect(toolManager.off).toHaveBeenCalledWith("onToolChanged", registeredListener);
    });
});
