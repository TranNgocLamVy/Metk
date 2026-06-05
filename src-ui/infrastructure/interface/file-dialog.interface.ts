export type FileDialogFilter = {
    name: string;
    extensions: string[];
};

export type OpenFileDialogOptions = {
    title?: string;
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
    filters?: FileDialogFilter[];
    canCreateDirectories?: boolean;
};

export type SaveFileDialogOptions = {
    title?: string;
    defaultPath?: string;
    filters?: FileDialogFilter[];
    canCreateDirectories?: boolean;
};

export interface IFileDialogService {
    open(options: OpenFileDialogOptions & { multiple: true }): Promise<string[] | null>;
    open(options?: OpenFileDialogOptions & { multiple?: false | undefined }): Promise<string | null>;
    open(options: OpenFileDialogOptions & { multiple: boolean }): Promise<string | string[] | null>;
    saveFile(options?: SaveFileDialogOptions): Promise<string | null>;
}
