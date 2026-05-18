import { appCore } from "@/editor/appcore";

export type CommandId =
    | "workspace.openFile"
    | "workspace.tilemap.redo"
    | "workspace.tilemap.undo"
    | "workspace.tilemap.save"
    | "workspace.tilemap.saveAll"
    | "workspace.tilemap.export.tmx"
    | "workspace.toggleConsole";

// 2. Create a clean, exported Facade function
export const executeCommand = (id: CommandId) => {
    appCore.systemCommandManager.execute(id);
};