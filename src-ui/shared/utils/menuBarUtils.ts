import { AppCore } from "@/core/appcore";



export class MenuBarUtils {
    public static isProjectOpened(): boolean {
        return AppCore.getIns().projectManager.currentProject != null;
    }

    public static isTilemapOpened(): boolean {
        const currentTilemapSession = AppCore.getIns().editorContext.getCurrentTilemapSession();
        return currentTilemapSession != null;
    }

    public static canUndo(): boolean {
        const editorContext = AppCore.getIns().editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        return historyManager?.canUndo ?? false;
    }

    public static canRedo(): boolean {
        const editorContext = AppCore.getIns().editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        return historyManager?.canRedo ?? false;
    }
}