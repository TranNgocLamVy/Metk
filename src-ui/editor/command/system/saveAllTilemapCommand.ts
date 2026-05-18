import { EditorContext } from "@/editor/application/editorContext";
import { SystemCommand } from "@/editor/decorator/command";
import { ISystemCommand } from "@/editor/interface/IBaseCommand";
import { Console } from "@/shared/services/consoleService";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.saveAll",
    name: "Save All",
    description: "",
    shortcuts: ["Ctrl+Shift+S"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class SaveAllTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const currentProject = context.currentProject;
        const workspace = context.currentWorkspace;

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