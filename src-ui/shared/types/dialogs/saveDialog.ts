
export type SaveResult = "save" | "not save" | "cancel";

export type SaveDialogOptions = {
    title: string;
    description: string;
};

export type SaveDialogItem = SaveDialogOptions & {
    resolve: (value: SaveResult) => void;
};