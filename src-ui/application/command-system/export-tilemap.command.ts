import { EditorFacade } from "@/application/editor.facade";
import { TmxTilemapExporter } from "@/application/exporter/tmx-tilemap.exporter";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

import { Console } from "@/ui/notifications/console-gateway";
import { SystemCommand } from "../commands/command.decorator";
import { ExportStorageService } from "@/infrastructure/export-storage.service";
import { FileDialogService } from "@/infrastructure/container";
import { SYSTEM_COMMAND_IDS } from "./command-ids";
import i18n from "@/app/providers/i18n";

@SystemCommand({
    id: SYSTEM_COMMAND_IDS.TilemapExportTmx,
    name: "global.action.tilemap.export",
    description: "",
    shortcuts: ["Ctrl+E"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class ExportTilemapTMXCommand implements ISystemCommand {
    public async execute(editorFacade: EditorFacade): Promise<Result> {
        const workspace = editorFacade.currentWorkspace;
        if (!workspace) return Result.Cancel();

        const tilemapSession = workspace.tilemapSessionManager.activeSession;
        if (!tilemapSession) return Result.Cancel();
        const tilemap = tilemapSession.tilemap;

        const exportPathManager = workspace.savedPathManager;
        let exportPath = exportPathManager.getExportPath(tilemap.id);
        if (!exportPath) {
            const savePath = await FileDialogService.saveFile({
                filters: [{ name: i18n.t("fileDialog.filters.tmx"), extensions: ["tmx"] }],
                canCreateDirectories: true,
                title: i18n.t("dialog.export.tilemap.title"),
            });
            if (!savePath) return Result.Cancel();
            exportPath = savePath;
        }

        const exporter = new TmxTilemapExporter(); // TODO: get custom exporter from appcore

        const buffer = exporter.export(tilemap, exportPath, editorFacade);

        const exportStorageService = new ExportStorageService();

        const result = await exportStorageService.exportToPath(exportPath, buffer);

        if (result.status === Result.Status.Success) {
            exportPathManager.setExportPath(tilemap.id, exportPath);
            await editorFacade.workspaceManager.saveCurrentWorkspace();
            Console.success({ message: { key: "message.tilemap.exportSuccess", options: { name: tilemap.name } } });
        }

        return result
    }
}
