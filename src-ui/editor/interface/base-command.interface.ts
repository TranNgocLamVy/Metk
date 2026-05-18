import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";

export interface IBaseCommand {
    readonly id: string;
    execute(context: EditorFacade): Result;
    undo(context: EditorFacade): Result;
    delete(): void;
}

export type ISystemCommandConstructor = new () => ISystemCommand

export interface ISystemCommand {
    execute(context: EditorFacade): Result | Promise<Result>;
}