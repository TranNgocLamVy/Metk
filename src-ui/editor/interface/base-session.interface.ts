import { HistoryManager } from "@/application/resources/history/history.manager";
import { IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { Application } from "pixi.js";

export interface IViewSession {
    id: string;
    destroy(): void;
}

export interface IEditorSession extends IViewSession, IUndoableCommandContext {
    historyManager: HistoryManager;
}

export interface IBaseView {
    activateView(pixiApp: Application): void;
    unActivateView(): void;
    destroy(): void;
}