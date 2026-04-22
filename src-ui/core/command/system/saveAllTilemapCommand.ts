import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";

@SystemCommand({
    id: "workspace.tilemap.saveAll",
    name: "Save All",
    description: "",
    shortcuts: ["Ctrl+Shift+S"],
    when: "inWorkspace && !isModalOpen",
})
export class SaveAllTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const currentProject = context.currentProject;
        const workspace = context.currentWorkspace;

        if (!currentProject) return Result.Error("Project not found");
        if (!workspace) return Result.Error("Workspace not found");

        const tilemapSessionManager = workspace.tilemapSessionManager;

        const tilemapSessions = tilemapSessionManager.tilemapsSession;

        for (const tilemapSession of tilemapSessions) {
            const tilemap = tilemapSession.tilemap;
            const saveResult = await currentProject.tilemapManager.saveTilemap(tilemap.id);
            if (saveResult.status === Result.Status.Success) {
                tilemapSession.markAsClean();
            }
        }
        useTilemapSessionStore.getState().refresh();
        ToastService.success({ message: "Tilemap saved successfully" }); // TODO: use Locale to display message

        return Result.Success();
    }
}