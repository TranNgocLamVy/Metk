import { EditorContext } from "@/core/application/editorContext";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

export class SaveCommand implements ISystemCommand {
    execute(context: EditorContext): Result {
        const currentProject = context.getCurrentProject();
        const tilemapSession = context.getCurrentTilemapSession();
        if (!currentProject) return ErrorResult("Project not found");
        if (!tilemapSession) return ErrorResult("Tilemap not found");
        const tilemap = tilemapSession?.tilemap;
        currentProject.tilemapManager.saveTilemap(tilemap.id);
        return SuccessResult();
    }
}