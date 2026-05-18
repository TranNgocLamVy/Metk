import { Result } from "@/shared/types/result";

import { EditorContext } from "../application/editorContext";

export interface IBaseCommand {
    readonly id: string;
    execute(context: EditorContext): Result;
    undo(context: EditorContext): Result;
    delete(): void;
}

export type ISystemCommandConstructor = new () => ISystemCommand

export interface ISystemCommand {
    execute(context: EditorContext): Result | Promise<Result>;
}