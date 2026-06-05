import { EditorFacade } from "@/application/editor.facade";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { SystemCommand } from "../commands/command.decorator";

@SystemCommand({
    id: "workspace.tilemap.view.zoomIn",
    name: "Zoom In",
    description: "",
    shortcuts: ["Ctrl+="],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class ViewZoomInCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const view = editorFacade.getActiveTilemapView();
        if (!view) return Result.Cancel();

        view.zoomIn();
        return Result.Success();
    }

    public canExecute(editorFacade: EditorFacade): boolean {
        return !!editorFacade.getActiveTilemapView();
    }
}

@SystemCommand({
    id: "workspace.tilemap.view.zoomOut",
    name: "Zoom Out",
    description: "",
    shortcuts: ["Ctrl+-"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class ViewZoomOutCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const view = editorFacade.getActiveTilemapView();
        if (!view) return Result.Cancel();

        view.zoomOut();
        return Result.Success();
    }

    public canExecute(editorFacade: EditorFacade): boolean {
        return !!editorFacade.getActiveTilemapView();
    }
}

@SystemCommand({
    id: "workspace.tilemap.view.normalSize",
    name: "Normal Size",
    description: "",
    shortcuts: ["Ctrl+0"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class ViewNormalSizeCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const view = editorFacade.getActiveTilemapView();
        if (!view) return Result.Cancel();

        view.normalSize();
        return Result.Success();
    }

    public canExecute(editorFacade: EditorFacade): boolean {
        return !!editorFacade.getActiveTilemapView();
    }
}

@SystemCommand({
    id: "workspace.tilemap.view.fitMapInView",
    name: "Fit Map in View",
    description: "",
    shortcuts: ["Ctrl+Shift+0"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class ViewFitMapInViewCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const view = editorFacade.getActiveTilemapView();
        if (!view) return Result.Cancel();

        view.fitMapInView();
        return Result.Success();
    }

    public canExecute(editorFacade: EditorFacade): boolean {
        return !!editorFacade.getActiveTilemapView();
    }
}
