
export interface Keybinding {
    commandId: string;
    key: string;
    when?: string;
}

export interface UserKeybindingOverride {
    commandId: string;
    key: string;
}