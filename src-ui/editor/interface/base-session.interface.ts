import { HistoryManager } from "@/application/resources/history/history.manager";
import { Application } from "pixi.js";

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