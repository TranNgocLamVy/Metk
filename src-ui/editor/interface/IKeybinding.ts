
export interface Keybinding {
    id: string;
    key: string;
    type: "command" | "tool";
    when?: string;
}

export interface UserKeybindingOverride {
    id: string;
    key: string;
    type: "command" | "tool";
}