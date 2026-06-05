import { appKernel } from "@/application/bootstrap/app-kernel";

const CommandList = [
    "workspace.openFile",
    "workspace.tilemap.redo",
    "workspace.tilemap.undo",
    "workspace.tilemap.save",
    "workspace.tilemap.saveAll",
    "workspace.tilemap.export.tmx",
    "workspace.toggleConsole",
] as const;

export type CommandId = typeof CommandList[number];

export function executeCommand(id: CommandId): void {
    appKernel.systemCommandManager.execute(id);
}

export function canExecuteCommand(id: CommandId): boolean {
    return appKernel.systemCommandManager.canExecute(id);
}
