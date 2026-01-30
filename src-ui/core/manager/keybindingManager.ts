import { KeyUtils } from "@/shared/utils/keyUtils";

import { CommandContext } from "../decorator/command";
import { ToolContext } from "../decorator/tool";
import { Keybinding, UserKeybindingOverride } from "../interface/IKeybinding";
import { SystemCommandManager } from "./systemCommandManager";
import { ToolManager } from "./toolManager";

export class KeybindingManager {
    private defaultKeyBinding: Keybinding[] = [];
    private userOverrides: Map<string, Keybinding> = new Map();
    private lookupTable: Map<string, Keybinding> = new Map();

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
                defaultKeyBinding.push({ key: s, id: commandData.id, type: "command" });
            })
        })

        ToolManager.TOOL_REGISTRY.forEach((toolContext: ToolContext) => {
            if (toolContext.shortcuts == undefined) return;
            toolContext.shortcuts.forEach((s) => {
                defaultKeyBinding.push({ key: s, id: toolContext.id, type: "tool" });
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
        const keystroke = KeyUtils.getKeystrokeString(e);
        
        if (this.lookupTable.has(keystroke)) {
            const binding = this.lookupTable.get(keystroke);
            if (!binding) return;
            e.preventDefault();
            e.stopPropagation();
            if (binding.type == "command") {
                this.commandManager.execute(binding.id);
            } else if (binding.type == "tool") {
                this.toolManager.startTool(binding.id);
            }
        }
    }

    public getShortcuts(commandId: string): string[] | undefined {
        const shortcuts: string[] = []
        this.lookupTable.forEach((value, key) => {
            if (value.id === commandId) shortcuts.push(key)
        })
        return shortcuts
    }
}