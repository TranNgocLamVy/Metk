export type PermissionDialogOptions = {
    title: string;
    description: string;
    okText?: string;
    cancelText?: string;
    okButtonVariant?: "default" | "destructive";
};

export type PermissionDialogItem = PermissionDialogOptions & {
    id: string;
    resolve: (value: boolean) => void;
};

export type SaveResult = "save" | "not save" | "cancel";

export type SaveDialogOptions = {
    title: string;
    description: string;
};

export type SaveDialogItem = SaveDialogOptions & {
    resolve: (value: SaveResult) => void;
};