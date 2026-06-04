import { appKernel } from "@/application/bootstrap/app-kernel";

export type CommandId =
    | "workspace.openFile"
    | "workspace.tilemap.redo"
    | "workspace.tilemap.undo"
    | "workspace.tilemap.save"
    | "workspace.tilemap.saveAll"
    | "workspace.tilemap.export.tmx"
    | "workspace.toggleConsole";

export function executeCommand(id: CommandId): void {
    appKernel.systemCommandManager.execute(id);
}
