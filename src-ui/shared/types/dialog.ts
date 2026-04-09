export enum DialogZLevel {
    Modal = 500,
    AlertDialog = 1000,
}

export type DialogConfig = {
    zLevel: DialogZLevel;
};

export type DialogItem<TParams = any> = {
    id: string;
    type: string;
    config: DialogConfig;
    params?: TParams;
};