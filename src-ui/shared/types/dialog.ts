export type DialogConfig = {
    zIndex?: number;
};

export type DialogItem<TParams = any> = {
    id: string;
    type: string;
    params?: TParams;
    config?: DialogConfig;
};