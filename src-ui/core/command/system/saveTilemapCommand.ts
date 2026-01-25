import { EditorContext } from "@/core/application/editorContext";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result } from "@/shared/types/result";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";

export class SaveTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const currentProject = context.getCurrentProject();
        const tilemapSession = context.getCurrentTilemapSession();
        if (!currentProject) return ErrorResult("Project not found");
        if (!tilemapSession) return ErrorResult("Tilemap not found");
        const tilemap = tilemapSession.tilemap;
        const saveResult = await currentProject.tilemapManager.saveTilemap(tilemap.id);
        if (saveResult.status == "Success") {
            tilemapSession.isDirty = false
            useTilemapSessionStore.getState().refresh();
        }
        return saveResult;
    }
}