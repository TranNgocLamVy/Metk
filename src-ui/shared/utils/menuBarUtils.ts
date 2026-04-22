import { appCore } from "@/core/appcore";



export class MenuBarUtils {
    public static isProjectOpened(): boolean {
        return appCore.projectManager.currentProject != null;
    }

    public static isTilemapOpened(): boolean {
        const currentTilemapSession = appCore.editorContext.getCurrentTilemapSession();
        return currentTilemapSession != null;
    }

    public static canUndo(): boolean {
        const editorContext = appCore.editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        return historyManager?.canUndo ?? false;
    }

    public static canRedo(): boolean {
        const editorContext = appCore.editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        return historyManager?.canRedo ?? false;
    }
}