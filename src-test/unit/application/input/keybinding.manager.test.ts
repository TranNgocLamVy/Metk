import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registryMock = vi.hoisted(() => ({
    commandRegistry: new Map(),
    toolFamilies: [] as any[],
}));

vi.mock("@/application/commands/system-command.manager", () => ({
    SystemCommandManager: {
        COMMAND_REGISTRY: registryMock.commandRegistry,
    },
}));

vi.mock("@/graphics/tool/tool.manager", () => ({}));

vi.mock("@/shared/utils/key.utils", () => ({
    KeyUtils: {
        getKeystrokeString: vi.fn(),
    },
}));

import { KeybindingManager } from "@/application/input/keybinding.manager";
import { SystemCommandManager } from "@/application/commands/system-command.manager";
import { KeyUtils } from "@/shared/utils/key.utils";

const createKeyboardEvent = (target?: Element) => {
    const event = new KeyboardEvent("keydown", { key: "x", bubbles: true });
    vi.spyOn(event, "preventDefault");
    vi.spyOn(event, "stopPropagation");
    if (target) {
        Object.defineProperty(document, "activeElement", {
            configurable: true,
            value: target,
        });
    }
    return event;
};

const createManager = () => {
    const commandManager = { execute: vi.fn() };
    const toolManager = {
        getToolFamilies: vi.fn(() => registryMock.toolFamilies),
        startToolFamily: vi.fn(),
    };
    const manager = new KeybindingManager(commandManager as any, toolManager as any);
    return { manager, commandManager, toolManager };
};

describe("KeybindingManager", () => {
    beforeEach(() => {
        SystemCommandManager.COMMAND_REGISTRY.clear();
        registryMock.toolFamilies = [];
        vi.mocked(KeyUtils.getKeystrokeString).mockReset();
        Object.defineProperty(document, "activeElement", {
            configurable: true,
            value: document.body,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("collects default command and tool shortcuts from registries", () => {
        SystemCommandManager.COMMAND_REGISTRY.set("workspace.save", {
            id: "workspace.save",
            name: "Save",
            shortcuts: ["Ctrl+S"],
            when: "projectOpened",
            constructor: class {},
        });
        registryMock.toolFamilies = [
            { id: "stamp", label: "Stamp", shortcuts: ["B"], tools: [] },
        ];

        const { manager } = createManager();

        expect(manager.getShortcuts("workspace.save")).toEqual(["Ctrl+S"]);
        expect(manager.getShortcuts("stamp")).toEqual(["B"]);
    });

    it("executes command shortcuts and consumes matched keyboard events", () => {
        const { manager, commandManager } = createManager();
        manager.registerDefaults([{ key: "Ctrl+S", id: "workspace.save", type: "command" }]);
        vi.mocked(KeyUtils.getKeystrokeString).mockReturnValue("Ctrl+S");
        const event = createKeyboardEvent();

        manager.handleKeyDown(event);

        expect(commandManager.execute).toHaveBeenCalledWith("workspace.save");
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it("executes tool shortcuts", () => {
        const { manager, toolManager } = createManager();
        manager.registerDefaults([{ key: "B", id: "stamp", type: "tool" }]);
        vi.mocked(KeyUtils.getKeystrokeString).mockReturnValue("B");

        manager.handleKeyDown(createKeyboardEvent());

        expect(toolManager.startToolFamily).toHaveBeenCalledWith("stamp");
    });

    it("ignores unknown shortcuts without consuming the event", () => {
        const { manager, commandManager, toolManager } = createManager();
        manager.registerDefaults([{ key: "Ctrl+S", id: "workspace.save", type: "command" }]);
        vi.mocked(KeyUtils.getKeystrokeString).mockReturnValue("Ctrl+P");
        const event = createKeyboardEvent();

        manager.handleKeyDown(event);

        expect(commandManager.execute).not.toHaveBeenCalled();
        expect(toolManager.startToolFamily).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it.each(["INPUT", "TEXTAREA", "SELECT"])("ignores shortcuts while %s has focus", (tagName) => {
        const { manager, commandManager } = createManager();
        const element = document.createElement(tagName);
        manager.registerDefaults([{ key: "Ctrl+S", id: "workspace.save", type: "command" }]);
        vi.mocked(KeyUtils.getKeystrokeString).mockReturnValue("Ctrl+S");

        manager.handleKeyDown(createKeyboardEvent(element));

        expect(commandManager.execute).not.toHaveBeenCalled();
        expect(KeyUtils.getKeystrokeString).not.toHaveBeenCalled();
    });

    it("ignores shortcuts while contenteditable elements have focus", () => {
        const { manager, commandManager } = createManager();
        const element = document.createElement("div");
        element.setAttribute("contenteditable", "true");
        manager.registerDefaults([{ key: "Ctrl+S", id: "workspace.save", type: "command" }]);

        manager.handleKeyDown(createKeyboardEvent(element));

        expect(commandManager.execute).not.toHaveBeenCalled();
    });

    it("applies user overrides and rebuilds shortcuts after registering defaults", () => {
        const { manager, commandManager, toolManager } = createManager();
        manager.registerDefaults([
            { key: "Ctrl+S", id: "workspace.save", type: "command" },
            { key: "B", id: "stamp", type: "tool" },
        ]);
        manager.applyUserOverrides([
            { key: "Ctrl+S", id: "stamp", type: "tool" },
            { key: "Ctrl+Shift+S", id: "workspace.save", type: "command" },
        ]);

        expect(manager.getShortcuts("workspace.save")).toEqual(["Ctrl+Shift+S"]);
        expect(manager.getShortcuts("stamp")).toEqual(["Ctrl+S", "B"]);

        vi.mocked(KeyUtils.getKeystrokeString).mockReturnValue("Ctrl+S");
        manager.handleKeyDown(createKeyboardEvent());

        expect(toolManager.startToolFamily).toHaveBeenCalledWith("stamp");
        expect(commandManager.execute).not.toHaveBeenCalled();

        manager.registerDefaults([{ key: "Ctrl+N", id: "workspace.new", type: "command" }]);

        expect(manager.getShortcuts("workspace.new")).toEqual(["Ctrl+N"]);
        expect(manager.getShortcuts("workspace.save")).toEqual(["Ctrl+Shift+S"]);
    });
});
