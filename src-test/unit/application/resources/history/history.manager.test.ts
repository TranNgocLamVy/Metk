import { describe, expect, it, vi } from "vitest";

import { HistoryManager } from "@/application/resources/history/history.manager";
import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

const createCommand = (id: string, calls: string[] = []): IUndoableCommand => ({
    id,
    execute: vi.fn(() => { calls.push(`execute:${id}`); return Result.Success(); }),
    undo: vi.fn(() => { calls.push(`undo:${id}`); return Result.Success(); }),
    delete: vi.fn(() => { calls.push(`delete:${id}`); }),
});

const createContext = (): IUndoableCommandContext => ({ objectRegistry: {} as any });

describe("HistoryManager", () => {
    it("tracks undo and redo state across command execution", () => {
        const context = createContext();
        const history = new HistoryManager();
        const first = createCommand("first");
        const second = createCommand("second");

        history.execute(first, context);
        history.undo(context);
        history.execute(second, context);

        expect(first.execute).toHaveBeenCalledTimes(1);
        expect(first.undo).toHaveBeenCalledTimes(1);
        expect(first.execute).toHaveBeenCalledWith(context);
        expect(first.undo).toHaveBeenCalledWith(context);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);
    });

    it("commits a transaction as one undoable batch", () => {
        const context = createContext();
        const calls: string[] = [];
        const history = new HistoryManager();

        history.startTransaction();
        history.execute(createCommand("first", calls), context);
        history.execute(createCommand("second", calls), context);

        expect(history.canUndo).toBe(false);

        history.commitTransaction();
        history.undo(context);
        history.redo(context);

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
        const context = createContext();
        const calls: string[] = [];
        const history = new HistoryManager();

        history.startTransaction();
        history.execute(createCommand("first", calls), context);
        history.execute(createCommand("second", calls), context);
        history.cancelTransaction(context);

        expect(calls).toEqual(["execute:first", "execute:second", "undo:second", "undo:first"]);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
    });

    it("deletes commands evicted by the configured history limit", () => {
        const context = createContext();
        const history = new HistoryManager(1);
        const evicted = createCommand("evicted");
        const retained = createCommand("retained");

        history.execute(evicted, context);
        history.execute(retained, context);

        expect(evicted.delete).toHaveBeenCalledTimes(1);
        expect(retained.delete).not.toHaveBeenCalled();
        expect(history.canUndo).toBe(true);
    });

    it("notifies subscribers when public state can change", () => {
        const context = createContext();
        const history = new HistoryManager();
        history.onStateChange = vi.fn();

        history.execute(createCommand("change"), context);
        history.undo(context);
        history.redo(context);

        expect(history.onStateChange).toHaveBeenCalledTimes(3);
    });

    it("uses a command-specific redo implementation when available", () => {
        const context = createContext();
        const history = new HistoryManager();
        const command: IUndoableCommand = {
            id: "redo-aware",
            execute: vi.fn(() => Result.Success()),
            undo: vi.fn(() => Result.Success()),
            redo: vi.fn(() => Result.Success()),
            delete: vi.fn(),
        };

        history.execute(command, context);
        history.undo(context);
        history.redo(context);

        expect(command.execute).toHaveBeenCalledTimes(1);
        expect(command.undo).toHaveBeenCalledTimes(1);
        expect(command.redo).toHaveBeenCalledTimes(1);
        expect(command.redo).toHaveBeenCalledWith(context);
    });
});
