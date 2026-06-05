import { EditorFacade } from "@/application/editor.facade";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { SystemCommand } from "../commands/command.decorator";
import { SYSTEM_COMMAND_IDS } from "./command-ids";

@SystemCommand({
    id: SYSTEM_COMMAND_IDS.TilemapViewZoomIn,
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
    id: SYSTEM_COMMAND_IDS.TilemapViewZoomOut,
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
    id: SYSTEM_COMMAND_IDS.TilemapViewNormalSize,
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
    id: SYSTEM_COMMAND_IDS.TilemapViewFitMapInView,
    name: "Fit Map in View",
    description: "",
    shortcuts: ["Ctrl+\\"],
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
