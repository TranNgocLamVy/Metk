import { describe, expect, it } from "vitest";

import { ToolSessionManager } from "@/application/workspace/session/tool-session.manager";

import { createEditorFacadeHarness } from "./session-manager-test-utils";

describe("ToolSessionManager", () => {
    it("loads remembered tile and rule tools without starting a global current tool", async () => {
        const { editorFacade, toolManager } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ tile: "tool.stamp", rule: "tool.bucket" }, editorFacade);

        await manager.load();

        expect(toolManager.startToolFamily).not.toHaveBeenCalled();
        expect(toolManager.on).toHaveBeenCalledWith("onToolChanged", expect.any(Function));
        expect(manager.serialize()).toEqual({ tile: "tool.stamp", rule: "tool.bucket" });
    });

    it("updates the tile remembered tool and saves when the active layer kind is tile", async () => {
        const { editorFacade, toolManager, workspaceManager } = createEditorFacadeHarness();
        let onToolChanged: ((familyId: string | null) => void) | undefined;
        (toolManager.on as any).mockImplementation((_eventName: string, listener: (familyId: string | null) => void) => {
            onToolChanged = listener;
        });
        (toolManager.getCurrentLayerKind as any).mockReturnValue("tile");
        const manager = new ToolSessionManager({ rule: "tool.bucket" }, editorFacade);

        await manager.load();
        await onToolChanged!("tool.line");

        expect(manager.serialize()).toEqual({ tile: "tool.line", rule: "tool.bucket" });
        expect(workspaceManager.saveCurrentWorkspace).toHaveBeenCalledTimes(1);
    });

    it("updates the rule remembered tool and saves when the active layer kind is rule", async () => {
        const { editorFacade, toolManager, workspaceManager } = createEditorFacadeHarness();
        (toolManager.getCurrentLayerKind as any).mockReturnValue("rule");
        const manager = new ToolSessionManager({ tile: "tool.stamp" }, editorFacade);

        await manager.onToolChange("tool.rectangle");

        expect(manager.serialize()).toEqual({ tile: "tool.stamp", rule: "tool.rectangle" });
        expect(workspaceManager.saveCurrentWorkspace).toHaveBeenCalledTimes(1);
    });

    it("ignores tool changes when the active layer kind is unsupported or no family is active", async () => {
        const { editorFacade, toolManager, workspaceManager } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ tile: "tool.stamp" }, editorFacade);

        (toolManager.getCurrentLayerKind as any).mockReturnValue("image");
        await manager.onToolChange("tool.image.move");
        (toolManager.getCurrentLayerKind as any).mockReturnValue("tile");
        await manager.onToolChange(null);

        expect(manager.serialize()).toEqual({ tile: "tool.stamp" });
        expect(workspaceManager.saveCurrentWorkspace).not.toHaveBeenCalled();
    });

    it("returns remembered tools only for persisted layer kinds", () => {
        const { editorFacade } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ tile: "tool.stamp", rule: "tool.bucket" }, editorFacade);

        expect(manager.getRememberedToolFamilyForLayerKind("tile")).toBe("tool.stamp");
        expect(manager.getRememberedToolFamilyForLayerKind("rule")).toBe("tool.bucket");
        expect(manager.getRememberedToolFamilyForLayerKind("image")).toBeNull();
    });

    it("updates state directly and unregisters the tool-change listener on destroy", async () => {
        const { editorFacade, toolManager } = createEditorFacadeHarness();
        const manager = new ToolSessionManager({ tile: "tool.stamp" }, editorFacade);

        await manager.load();
        const registeredListener = (toolManager.on as any).mock.calls[0][1];
        await manager.updateToolState({ rule: "tool.eraser" });
        await manager.destroy();

        expect(manager.serialize()).toEqual({ tile: "tool.stamp", rule: "tool.eraser" });
        expect(toolManager.off).toHaveBeenCalledWith("onToolChanged", registeredListener);
    });
});
