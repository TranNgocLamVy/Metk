import { CommandIdTypes } from "../constance/systemCommand";

export interface Keybinding {
    commandId: CommandIdTypes;
    key: string;
    when?: string;
}

export interface UserKeybindingOverride {
    commandId: string;
    key: string;
}