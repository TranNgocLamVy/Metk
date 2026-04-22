import { EditorContext } from "@/core/application/editorContext";
import { TmxTilemapExporter } from "@/core/application/exporter/TmxTilemapExporter";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { save } from "@tauri-apps/plugin-dialog";

import { ExportStorageService } from "../../../infrastructure/exportStorageService";

@SystemCommand({
    id: "project.export",
    name: "Export Tilemap",
    description: "",
    shortcuts: ["Ctrl+E"],
    when: "inWorkspace",
})
export class ExportTilemapCommand implements ISystemCommand {
    public async execute(context: EditorContext): Promise<Result> {
        const workspace = context.currentWorkspace;
        if (!workspace) return Result.Error("No workspace");

        const tilemapSession = workspace.tilemapSessionManager.currentTilemapSession;
        if (!tilemapSession) return Result.Cancel();
        const tilemap = tilemapSession.tilemap;
        if (!tilemap) return Result.Error("Tilemap not found");

        const exportPathManager = workspace.exportPathManager;
        let exportPath = exportPathManager.getExportPath(tilemap.id);
        if (!exportPath) {
            const savePath = await save({
                filters: [{ name: "TMX", extensions: ["tmx"] }],
                canCreateDirectories: true,
                title: "Export Tilemap",
            });
            if (!savePath) return Result.Cancel();
            exportPath = savePath;
        }

        const exporter = new TmxTilemapExporter(); // TODO: get custom exporter from appcore

        const buffer = exporter.export(tilemap, exportPath, context);

        const exportStorageService = new ExportStorageService();

        const result = await exportStorageService.exportToPath(exportPath, buffer);

        if (result.status === Result.Status.Success) {
            exportPathManager.setExportPath(tilemap.id, exportPath);
            await context.workspaceManager.saveCurrentWorkspace();
            
            ToastService.success({ message: "Tilemap exported successfully" });
        }

        return result
    }
}