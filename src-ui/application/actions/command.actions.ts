import { appKernel } from "@/application/bootstrap/app-kernel";
import { type SystemCommandId } from "@/application/command-system/command-ids";

export function executeCommand(id: SystemCommandId): void {
    appKernel.systemCommandManager.execute(id);
}

export function canExecuteCommand(id: SystemCommandId): boolean {
    return appKernel.systemCommandManager.canExecute(id);
}
