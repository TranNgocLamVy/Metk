import { describe, expect, it, vi } from "vitest";

import { HistoryManager } from "@/application/resources/history/history.manager";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

const createCommand = (id: string, calls: string[] = []): IUndoableCommand => ({
    id,
    execute: vi.fn(() => { calls.push(`execute:${id}`); return Result.Success(); }),
    undo: vi.fn(() => { calls.push(`undo:${id}`); return Result.Success(); }),
    delete: vi.fn(() => { calls.push(`delete:${id}`); }),
});

describe("HistoryManager", () => {
    it("tracks undo and redo state across command execution", () => {
        const editorFacade = {} as any;
        const history = new HistoryManager();
        const first = createCommand("first");
        const second = createCommand("second");

        history.execute(first, editorFacade);
        history.undo(editorFacade);
        history.execute(second, editorFacade);

        expect(first.execute).toHaveBeenCalledTimes(1);
        expect(first.undo).toHaveBeenCalledTimes(1);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);
    });

    it("commits a transaction as one undoable batch", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const history = new HistoryManager();

        history.startTransaction();
        history.execute(createCommand("first", calls), editorFacade);
        history.execute(createCommand("second", calls), editorFacade);

        expect(history.canUndo).toBe(false);

        history.commitTransaction();
        history.undo(editorFacade);
        history.redo(editorFacade);

        expect(calls).toEqual([
            "execute:first",
            "execute:second",
            "undo:second",
            "undo:first",
            "execute:first",
            "execute:second",
        ]);
    });

    it("cancels a transaction by undoing pending commands without adding history", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const history = new HistoryManager();

        history.startTransaction();
        history.execute(createCommand("first", calls), editorFacade);
        history.execute(createCommand("second", calls), editorFacade);
        history.cancelTransaction(editorFacade);

        expect(calls).toEqual(["execute:first", "execute:second", "undo:second", "undo:first"]);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
    });

    it("deletes commands evicted by the configured history limit", () => {
        const editorFacade = {} as any;
        const history = new HistoryManager(1);
        const evicted = createCommand("evicted");
        const retained = createCommand("retained");

        history.execute(evicted, editorFacade);
        history.execute(retained, editorFacade);

        expect(evicted.delete).toHaveBeenCalledTimes(1);
        expect(retained.delete).not.toHaveBeenCalled();
        expect(history.canUndo).toBe(true);
    });

    it("notifies subscribers when public state can change", () => {
        const editorFacade = {} as any;
        const history = new HistoryManager();
        history.onStateChange = vi.fn();

        history.execute(createCommand("change"), editorFacade);
        history.undo(editorFacade);
        history.redo(editorFacade);

        expect(history.onStateChange).toHaveBeenCalledTimes(3);
    });
});
