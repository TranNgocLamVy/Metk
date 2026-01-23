import { HistoryManager } from "../manager/historyManager";

export interface IBaseSession {
    id: string;
    historyManager: HistoryManager;
}