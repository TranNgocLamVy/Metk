import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../commands/command.decorator";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Console } from "@/ui/notifications/console-gateway";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.save",
    name: "Save",
    description: "",
    shortcuts: ["Ctrl+S"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class SaveTilemapCommand implements ISystemCommand {
    public async execute(editorFacade: EditorFacade): Promise<Result> {
        const currentProject = editorFacade.currentProject;
        const tilemapSession = editorFacade.getActiveTilemapSession();
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