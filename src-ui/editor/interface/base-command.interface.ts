import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";

export interface IBaseCommand {
    readonly id: string;
    execute(editorFacade: EditorFacade): Result;
    undo(editorFacade: EditorFacade): Result;
    delete(): void;
}

export type ISystemCommandConstructor = new () => ISystemCommand

export interface ISystemCommand {
    execute(editorFacade: EditorFacade): Result | Promise<Result>;
}