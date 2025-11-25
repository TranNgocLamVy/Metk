export type PermissionDialogOptions = {
    title: string;
    description: string;
    okText?: string;
    cancelText?: string;
};

export type PermissionDialogItem = PermissionDialogOptions & {
    id: string;
    resolve: (value: boolean) => void;
};