import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../commands/command.decorator";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Console } from "@/shared/services/console.service";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.saveAll",
    name: "Save All",
    description: "",
    shortcuts: ["Ctrl+Shift+S"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class SaveAllTilemapCommand implements ISystemCommand {
    public async execute(editorFacade: EditorFacade): Promise<Result> {
        const currentProject = editorFacade.currentProject;
        const workspace = editorFacade.currentWorkspace;

        if (!currentProject) return Result.Cancel();
        if (!workspace) return Result.Cancel();

        const tilemapSessionManager = workspace.tilemapSessionManager;

        const tilemapSessions = tilemapSessionManager.tilemapsSession;

        for (const tilemapSession of tilemapSessions) {
            const tilemap = tilemapSession.tilemap;
            const saveResult = await currentProject.tilemapManager.saveTilemap(tilemap.id);
            if (saveResult.status === Result.Status.Success) {
                tilemapSession.markAsClean();
            }
        }

        Console.success({ message: "message.tilemap.saveAllSuccess"});

        return Result.Success();
    }
}