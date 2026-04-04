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