import { KeyUtils } from "@/shared/utils/key.utils";

import { Keybinding, UserKeybindingOverride } from "@/editor/interface/keybinding.interface";
import { ToolManager } from "@/graphics/tool/tool.manager";
import { CommandContext } from "../commands/command.decorator";
import { SystemCommandManager } from "../commands/system-command.manager";

export class KeybindingManager {
    private defaultKeyBinding: Keybinding[] = [];
    private userOverrides: Map<string, Keybinding> = new Map();
    private lookupTable: Map<string, Keybinding> = new Map();

    private static activeContexts: Set<string> = new Set();
    
    private flags: Map<string, Set<string>> = new Map();
    private values: Map<string, string | number | boolean> = new Map();

    private bindOnKeyDown: (e: KeyboardEvent) => void

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
        overrides.forEach(o => {
            this.userOverrides.set(o.key, o);
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
        if (this.isEditableElement(document.activeElement)) {
            return;
        }

        const keystroke = KeyUtils.getKeystrokeString(e);
        
        if (this.lookupTable.has(keystroke)) {
            const binding = this.lookupTable.get(keystroke);
            if (!binding) return;

            e.preventDefault();
            e.stopPropagation();
            if (binding.type == "command") {
                this.commandManager.execute(binding.id);
            } else if (binding.type == "tool") {
                this.toolManager.startToolFamily(binding.id);
            }
        }
    }

    private isEditableElement(el: Element | null): boolean {
        if (!el) return false;

        const tagName = el.tagName.toUpperCase();
        const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
        const isContentEditable = el.getAttribute('contenteditable') === 'true';

        return isInput || isContentEditable;
    }

    public getShortcuts(commandId: string): string[] | undefined {
        const shortcuts: string[] = []
        this.lookupTable.forEach((value, key) => {
            if (value.id === commandId) shortcuts.push(key)
        })
        return shortcuts
    }
}