import { Application } from "pixi.js";

import { HistoryManager } from "../manager/historyManager";

export interface IBaseSession {
    id: string;
    historyManager: HistoryManager;
    destroy(): void;
}

export interface IBaseSessionView {
    activateSession(pixiApp: Application): void;
    unActivateSession(): void;
    destroy(): void;
}