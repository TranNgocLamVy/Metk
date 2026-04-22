import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";

@SystemCommand({
    id: "project.save",
    name: "Save",
    description: "",
    shortcuts: ["Ctrl+S"],
})
export class SaveTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const currentProject = context.currentProject;
        const tilemapSession = context.getCurrentTilemapSession();
        if (!currentProject) return Result.Error("Project not found");
        if (!tilemapSession) return Result.Error("Tilemap not found");
        const tilemap = tilemapSession.tilemap;
        const saveResult = await currentProject.tilemapManager.saveTilemap(tilemap.id);
        if (saveResult.status === Result.Status.Success) {
            tilemapSession.markAsClean();
            useTilemapSessionStore.getState().refresh();
            ToastService.success({ message: "Tilemap saved successfully" });
        }
        return saveResult;
    }
}