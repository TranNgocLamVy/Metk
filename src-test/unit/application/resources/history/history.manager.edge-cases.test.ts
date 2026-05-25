import { describe, expect, it, vi } from "vitest";

import { HistoryManager } from "@/application/resources/history/history.manager";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

type CommandDoubleOptions = {
    executeResult?: Result;
    undoResult?: Result;
    calls?: string[];
};

const createCommandDouble = (id: string, options: CommandDoubleOptions = {}): IUndoableCommand => {
    const calls = options.calls ?? [];
    return {
        id,
        execute: vi.fn(() => {
            calls.push(`execute:${id}`);
            return options.executeResult ?? Result.Success();
        }),
        undo: vi.fn(() => {
            calls.push(`undo:${id}`);
            return options.undoResult ?? Result.Success();
        }),
        delete: vi.fn(() => {
            calls.push(`delete:${id}`);
        }),
    };
};

describe("HistoryManager edge cases", () => {
    it("keeps the active transaction intact when starting a nested transaction", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const history = new HistoryManager();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        history.startTransaction();
        history.execute(createCommandDouble("first", { calls }), editorFacade);
        history.startTransaction();
        history.execute(createCommandDouble("second", { calls }), editorFacade);
        history.commitTransaction();

        expect(warn).toHaveBeenCalledWith("Transaction already active! Nested transactions not supported yet.");
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);

        history.undo(editorFacade);

        expect(calls).toEqual([
            "execute:first",
            "execute:second",
            "undo:second",
            "undo:first",
        ]);

        warn.mockRestore();
    });

    it("commits an empty transaction without changing stack state or notifying", () => {
        const history = new HistoryManager();
        history.onStateChange = vi.fn();

        history.startTransaction();
        history.commitTransaction();

        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
        expect(history.onStateChange).not.toHaveBeenCalled();
    });

    it("cancels an empty transaction without changing stack state or notifying", () => {
        const history = new HistoryManager();
        history.onStateChange = vi.fn();

        history.startTransaction();
        history.cancelTransaction({} as any);

        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
        expect(history.onStateChange).not.toHaveBeenCalled();
    });

    it("does not notify or call commands when undo and redo stacks are empty", () => {
        const editorFacade = {} as any;
        const history = new HistoryManager();
        history.onStateChange = vi.fn();

        history.undo(editorFacade);
        history.redo(editorFacade);

        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
        expect(history.onStateChange).not.toHaveBeenCalled();
    });

    it("notifies for mutating operations but not for no-op stack operations", () => {
        const editorFacade = {} as any;
        const history = new HistoryManager();
        const command = createCommandDouble("paint");
        history.onStateChange = vi.fn();

        history.undo(editorFacade);
        history.execute(command, editorFacade);
        history.undo(editorFacade);
        history.redo(editorFacade);
        history.redo(editorFacade);

        expect(history.onStateChange).toHaveBeenCalledTimes(3);
        expect(command.execute).toHaveBeenCalledTimes(2);
        expect(command.undo).toHaveBeenCalledTimes(1);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);
    });

    it("does not record or notify a command that returns an error during execution", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const history = new HistoryManager();
        const failingCommand = createCommandDouble("invalid", {
            calls,
            executeResult: Result.Error("Cannot paint locked layer"),
        });
        history.onStateChange = vi.fn();

        expect(history.execute(failingCommand, editorFacade)).toMatchObject({
            status: "Error",
            message: { key: "Cannot paint locked layer" },
        });

        expect(calls).toEqual(["execute:invalid"]);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
        expect(history.onStateChange).not.toHaveBeenCalled();

        history.undo(editorFacade);

        expect(failingCommand.undo).not.toHaveBeenCalled();
    });

    it("does not include failed commands in an active transaction", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const history = new HistoryManager();

        history.startTransaction();
        history.execute(createCommandDouble("first", { calls }), editorFacade);
        history.execute(createCommandDouble("failed", {
            calls,
            executeResult: Result.Error("Command failed"),
        }), editorFacade);
        history.execute(createCommandDouble("second", { calls }), editorFacade);
        history.commitTransaction();
        history.undo(editorFacade);

        expect(calls).toEqual([
            "execute:first",
            "execute:failed",
            "execute:second",
            "undo:second",
            "undo:first",
        ]);
        expect(history.canRedo).toBe(true);
    });

    it("resets the redo stack after executing a new command following undo", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const history = new HistoryManager();
        const first = createCommandDouble("first", { calls });
        const second = createCommandDouble("second", { calls });

        history.execute(first, editorFacade);
        history.undo(editorFacade);

        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(true);

        history.execute(second, editorFacade);

        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);

        history.redo(editorFacade);

        expect(calls).toEqual([
            "execute:first",
            "undo:first",
            "execute:second",
        ]);
        expect(first.execute).toHaveBeenCalledTimes(1);
        expect(second.execute).toHaveBeenCalledTimes(1);
    });
});
