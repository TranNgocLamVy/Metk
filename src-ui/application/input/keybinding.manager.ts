import { KeyUtils } from "@/shared/utils/key.utils";

import { Keybinding, UserKeybindingOverride } from "@/editor/interface/keybinding.interface";
import { ToolManager } from "@/graphics/tool/tool.manager";
import { CommandContext } from "../commands/command.decorator";
import { SystemCommandManager } from "../commands/system-command.manager";

export class KeybindingManager {
    private defaultKeyBinding: Keybinding[] = [];
    private userOverrides: Map<string, Keybinding> = new Map();
    private lookupTable: Map<string, Keybinding> = new Map();

    private bindOnKeyDown: (e: KeyboardEvent) => void;

    constructor(
        private commandManager: SystemCommandManager,
        private toolManager: ToolManager
    ) {
        this.bindOnKeyDown = this.handleKeyDown.bind(this);

        const defaultKeyBinding: Keybinding[] = [];
        SystemCommandManager.COMMAND_REGISTRY.forEach((commandData: CommandContext) => {
            if (commandData.shortcuts == undefined) return;
            commandData.shortcuts.forEach((s) => {
                defaultKeyBinding.push({ key: s, id: commandData.id, type: "command", when: commandData.when });
            })
        })

        this.toolManager.getToolFamilies().forEach((toolFamily) => {
            if (toolFamily.shortcuts == undefined) return;
            toolFamily.shortcuts.forEach((s) => {
                defaultKeyBinding.push({ key: s, id: toolFamily.id, type: "tool", when: "inWorkspace && !isModalOpen" });
            })
        })

        this.registerDefaults(defaultKeyBinding);
        window.addEventListener("keydown", this.bindOnKeyDown);
    }

    public registerDefaults(bindings: Keybinding[]) {
        this.defaultKeyBinding = bindings;
        this.rebuildLookupTable();
    }

    public applyUserOverrides(overrides: UserKeybindingOverride[]) {
        this.userOverrides.clear();
        overrides.forEach((override) => {
            this.userOverrides.set(override.key, override);
        });
        this.rebuildLookupTable();
    }

    private rebuildLookupTable() {
        this.lookupTable.clear();
        this.defaultKeyBinding.forEach((binding) => {
            this.lookupTable.set(binding.key, binding);
        });
        this.userOverrides.forEach((binding) => {
            this.lookupTable.set(binding.key, binding);
        });
    }

    public handleKeyDown(e: KeyboardEvent) {
        const keystroke = KeyUtils.getKeystrokeString(e);
        const binding = this.lookupTable.get(keystroke);

        if (!binding) return;

        const target = this.getEventTargetElement(e);

        if (this.shouldLetEditableElementHandleShortcut(target, binding)) {
            return;
        }

        if (binding.type === "command") {
            if (!this.commandManager.canExecute(binding.id)) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            this.commandManager.execute(binding.id);
            return;
        }

        if (binding.type === "tool") {
            if (this.isEditableElement(target)) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            this.toolManager.startToolFamily(binding.id);
        }
    }

    private getEventTargetElement(e: KeyboardEvent): Element | null {
        if (e.target instanceof Element) {
            return e.target;
        }

        return document.activeElement;
    }

    private shouldLetEditableElementHandleShortcut(target: Element | null, binding: Keybinding): boolean {
        if (!this.isEditableElement(target)) {
            return false;
        }

        if (binding.type !== "command") {
            return true;
        }

        return !this.isAppShortcutAllowed(target, binding.id);
    }

    private isEditableElement(el: Element | null): boolean {
        if (!el) return false;

        const tagName = el.tagName.toUpperCase();

        const isInput =
            tagName === "INPUT" ||
            tagName === "TEXTAREA" ||
            tagName === "SELECT";

        const isContentEditable =
            el.getAttribute("contenteditable") === "true";

        return isInput || isContentEditable;
    }

    private isAppShortcutAllowed(target: Element | null, commandId: string): boolean {
        if (!target) return false;

        const shortcutScope = target.closest("[data-app-shortcuts]");
        if (!shortcutScope) return false;

        const value = shortcutScope.getAttribute("data-app-shortcuts");
        if (!value) return false;

        if (value === "all") return true;

        return value
            .split(/\s+/)
            .filter(Boolean)
            .includes(commandId);
    }

    public getShortcuts(commandId: string): string[] | undefined {
        const shortcuts: string[] = [];

        this.lookupTable.forEach((value, key) => {
            if (value.id === commandId) shortcuts.push(key);
        });

        return shortcuts;
    }
}