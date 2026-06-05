import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";

export interface IUndoableCommandContext {
    objectRegistry: EditorObjectRegistry;
}

export interface IUndoableCommand {
    readonly id: string;
    execute(context: IUndoableCommandContext): Result;
    undo(context: IUndoableCommandContext): Result;
    redo?(context: IUndoableCommandContext): Result;
    delete(): void;
}

export type ISystemCommandConstructor = new () => ISystemCommand

export interface ISystemCommand {
    execute(editorFacade: EditorFacade): Result | Promise<Result>;
    canExecute?(editorFacade: EditorFacade): boolean;
}
