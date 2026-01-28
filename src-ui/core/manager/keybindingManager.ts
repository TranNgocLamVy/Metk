import { KeyUtils } from "@/shared/utils/keyUtils";

import { CommandData } from "../decorator/command";
import { Keybinding, UserKeybindingOverride } from "../interface/IKeybinding";
import { SystemCommandManager } from "./systemCommandManager";

export class KeybindingManager {
    private defaultKeyBinding: Keybinding[] = [];
    private userOverrides: Map<string, string> = new Map();
    private lookupTable: Map<string, string> = new Map();

    private bindOnKeyDown: (e: KeyboardEvent) => void

    constructor(private commandManager: SystemCommandManager) {
        this.bindOnKeyDown = this.handleKeyDown.bind(this);

        const defaultKeyBinding: Keybinding[] = [];
        SystemCommandManager.COMMAND_REGISTRY.forEach((commandData: CommandData) => {
            if (commandData.shortcuts == undefined) return;
            commandData.shortcuts.forEach((s) => {
                defaultKeyBinding.push({ key: s, commandId: commandData.id });
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
            this.userOverrides.set(o.key, o.commandId);
        });
        this.rebuildLookupTable();
    }

    private rebuildLookupTable() {
        this.lookupTable.clear();
        this.defaultKeyBinding.forEach((binding) => {
            this.lookupTable.set(binding.key, binding.commandId);
        });
        this.userOverrides.forEach((newKey, commandId) => {
            this.lookupTable.set(newKey, commandId); 
        });
    }

    public handleKeyDown(e: KeyboardEvent) {
        const keystroke = KeyUtils.getKeystrokeString(e);
        
        if (this.lookupTable.has(keystroke)) {
            const commandId = this.lookupTable.get(keystroke);
            
            if (commandId) {
                e.preventDefault();
                e.stopPropagation();
                this.commandManager.execute(commandId);
            }
        }
    }

    public getShortcuts(commandId: string): string[] | undefined {
        const shortcuts: string[] = []
        this.lookupTable.forEach((value, key) => {
            if (value === commandId) shortcuts.push(key)
        })
        return shortcuts
    }
}