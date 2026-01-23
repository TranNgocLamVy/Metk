import { KeyUtils } from "@/shared/utils/keyUtils";

import { DEFAULT_KEYBINDINGS } from "../constance/keybinding";
import { Keybinding, UserKeybindingOverride } from "../interface/IKeybinding";
import { SystemCommandManager } from "./SystemCommandManager";

export class KeybindingManager {
    private defaults: Map<string, Keybinding> = new Map();
    private userOverrides: Map<string, string> = new Map();
    private lookupTable: Map<string, string> = new Map();

    private bindOnKeyDown: (e: KeyboardEvent) => void

    constructor(private commandManager: SystemCommandManager) {
        this.bindOnKeyDown = this.handleKeyDown.bind(this);
        this.registerDefaults(DEFAULT_KEYBINDINGS);
        window.addEventListener("keydown", this.bindOnKeyDown);
    }

    public registerDefaults(bindings: Keybinding[]) {
        bindings.forEach(b => {
            this.defaults.set(b.commandId, b);
        });
        this.rebuildLookupTable();
    }

    public applyUserOverrides(overrides: UserKeybindingOverride[]) {
        this.userOverrides.clear();
        overrides.forEach(o => {
            this.userOverrides.set(o.commandId, o.key);
        });
        this.rebuildLookupTable();
    }

    private rebuildLookupTable() {
        this.lookupTable.clear();
        this.defaults.forEach((binding) => {
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
}