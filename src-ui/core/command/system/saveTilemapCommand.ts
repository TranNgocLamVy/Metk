import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Console } from "@/shared/services/consoleService";
import { Result } from "@/shared/types/result";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";

@SystemCommand({
    id: "workspace.tilemap.save",
    name: "Save",
    description: "",
    shortcuts: ["Ctrl+S"],
    when: "inWorkspace && !isModalOpen",
})
export class SaveTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const currentProject = context.currentProject;
        const tilemapSession = context.getCurrentTilemapSession();
        if (!currentProject) return Result.Cancel();
        if (!tilemapSession) return Result.Cancel();
        const tilemap = tilemapSession.tilemap;
        const saveResult = await currentProject.tilemapManager.saveTilemap(tilemap.id);
        if (saveResult.status === Result.Status.Success) {
            tilemapSession.markAsClean();
            useTilemapSessionStore.getState().refresh();
            Console.success({ message: "message.tilemap.savSuccess"});
        }
        return saveResult;
    }
}