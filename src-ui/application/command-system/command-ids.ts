export const SYSTEM_COMMAND_IDS = {
    OpenFile: "workspace.openFile",
    TilemapRedo: "workspace.tilemap.redo",
    TilemapUndo: "workspace.tilemap.undo",
    TilemapViewZoomIn: "workspace.tilemap.view.zoomIn",
    TilemapViewZoomOut: "workspace.tilemap.view.zoomOut",
    TilemapViewNormalSize: "workspace.tilemap.view.normalSize",
    TilemapViewFitMapInView: "workspace.tilemap.view.fitMapInView",
    TilemapSave: "workspace.tilemap.save",
    TilemapSaveAll: "workspace.tilemap.saveAll",
    TilemapExportTmx: "workspace.tilemap.export.tmx",
    ToggleConsole: "workspace.toggleConsole",
} as const;

export type SystemCommandId = typeof SYSTEM_COMMAND_IDS[keyof typeof SYSTEM_COMMAND_IDS];
