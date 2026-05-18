import { EditorFacade } from "@/application/editor.facade";
import { TmxTilemapExporter } from "@/application/exporter/tmx-tilemap.exporter";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { save } from "@tauri-apps/plugin-dialog";

import { Console } from "@/shared/services/console.service";
import { SystemCommand } from "../command.decorator";
import { ExportStorageService } from "@/infrastructure/exportStorageService";

@SystemCommand({
    id: "workspace.tilemap.export.tmx",
    name: "Export Tilemap",
    description: "",
    shortcuts: ["Ctrl+E"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class ExportTilemapTMXCommand implements ISystemCommand {
    public async execute(context: EditorFacade): Promise<Result> {
        const workspace = context.currentWorkspace;
        if (!workspace) return Result.Cancel();

        const tilemapSession = workspace.tilemapSessionManager.activeSession;
        if (!tilemapSession) return Result.Cancel();
        const tilemap = tilemapSession.tilemap;

        const exportPathManager = workspace.savedPathManager;
        let exportPath = exportPathManager.getExportPath(tilemap.id);
        if (!exportPath) {
            // TODO: Move this to infrastructure
            const savePath = await save({
                filters: [{ name: "TMX", extensions: ["tmx"] }],
                canCreateDirectories: true,
                title: "Export Tilemap", // TODO: i18n
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
            Console.success({ message: "message.tilemap.exportSuccess"});
        }

        return result
    }
}