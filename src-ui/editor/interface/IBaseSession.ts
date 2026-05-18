import { Application } from "pixi.js";

import { HistoryManager } from "../manager/historyManager";

export interface IBaseSession {
    id: string;
    historyManager: HistoryManager;
    destroy(): void;
}

export interface IBaseView {
    activateView(pixiApp: Application): void;
    unActivateView(): void;
    destroy(): void;
}