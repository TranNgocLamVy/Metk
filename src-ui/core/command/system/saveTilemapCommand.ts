import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Console } from "@/shared/services/consoleService";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.save",
    name: "Save",
    description: "",
    shortcuts: ["Ctrl+S"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class SaveTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const currentProject = context.currentProject;
        const tilemapSession = context.getActiveTilemapSession();
        if (!currentProject) return Result.Cancel();
        if (!tilemapSession) return Result.Cancel();
        const tilemap = tilemapSession.tilemap;
        const saveResult = await currentProject.tilemapManager.saveTilemap(tilemap.id);
        if (saveResult.status === Result.Status.Success) {
            tilemapSession.markAsClean();
            Console.success({ message: { key: "message.tilemap.saveSuccess", options: { name: tilemap.name }}});
        }
        return saveResult;
    }
}