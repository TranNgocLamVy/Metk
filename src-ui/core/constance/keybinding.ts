import { Keybinding } from "../interface/IKeybinding";

export const DEFAULT_KEYBINDINGS: Keybinding[] = [
    { commandId: "project.save", key: "Ctrl+S" },
    { commandId: "project.undo", key: "Ctrl+Z" },
    { commandId: "project.redo", key: "Ctrl+Y" },
];