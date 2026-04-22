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

        ToolManager.TOOL_REGISTRY.forEach((toolContext: ToolContext) => {
            if (toolContext.shortcuts == undefined) return;
            toolContext.shortcuts.forEach((s) => {
                defaultKeyBinding.push({ key: s, id: toolContext.id, type: "tool", when: toolContext.when });
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

    public setFlag(flag: string, isActive: boolean, instigatorId: string) {
        if (!this.flags.has(flag)) {
            this.flags.set(flag, new Set());
        }

        const instigators = this.flags.get(flag)!;
        
        if (isActive) {
            instigators.add(instigatorId);
        } else {
            instigators.delete(instigatorId);
        }
    }

    public setValue(key: string, value: string | number | boolean) {
        this.values.set(key, value);
    }

    private evaluateWhen(when?: string): boolean {
        if (!when) return true; 

        const orConditions = when.split('||').map(c => c.trim());
        
        return orConditions.some(orCondition => {
            const andConditions = orCondition.split('&&').map(c => c.trim());
            
            return andConditions.every(condition => {
                if (condition.includes('==')) {
                    const [key, val] = condition.split('==').map(s => s.trim());
                    const cleanVal = val.replace(/^["'](.+(?=["']$))["']$/, '$1'); 
                    return this.values.get(key) === cleanVal;
                }
                if (condition.includes('!=')) {
                    const [key, val] = condition.split('!=').map(s => s.trim());
                    const cleanVal = val.replace(/^["'](.+(?=["']$))["']$/, '$1');
                    return this.values.get(key) !== cleanVal;
                }

                if (condition.startsWith('!')) {
                    const flag = condition.substring(1).trim();
                    const instigators = this.flags.get(flag);
                    return !instigators || instigators.size === 0;
                }

                const instigators = this.flags.get(condition);
                return instigators && instigators.size > 0;
            });
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

            if (!this.evaluateWhen(binding.when)) return;

            e.preventDefault();
            e.stopPropagation();
            if (binding.type == "command") {
                this.commandManager.execute(binding.id);
            } else if (binding.type == "tool") {
                this.toolManager.startTool(binding.id);
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