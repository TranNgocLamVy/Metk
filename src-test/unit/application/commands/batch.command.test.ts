import { describe, expect, it, vi } from "vitest";

import { BatchCommand } from "@/application/commands/batch.command";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

const createCommand = (overrides: Partial<IBaseCommand> = {}): IBaseCommand => ({
    id: crypto.randomUUID(),
    execute: vi.fn(() => Result.Success()),
    undo: vi.fn(() => Result.Success()),
    delete: vi.fn(),
    ...overrides,
});

describe("BatchCommand", () => {
    it("executes child commands in declaration order", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const first = createCommand({ execute: vi.fn(() => { calls.push("first"); return Result.Success(); }) });
        const second = createCommand({ execute: vi.fn(() => { calls.push("second"); return Result.Success(); }) });

        const result = new BatchCommand([first, second]).execute(editorFacade);

        expect(result.status).toBe(Result.Status.Success);
        expect(calls).toEqual(["first", "second"]);
        expect(first.execute).toHaveBeenCalledWith(editorFacade);
        expect(second.execute).toHaveBeenCalledWith(editorFacade);
    });

    it("undoes child commands in reverse order", () => {
        const editorFacade = {} as any;
        const calls: string[] = [];
        const first = createCommand({ undo: vi.fn(() => { calls.push("first"); return Result.Success(); }) });
        const second = createCommand({ undo: vi.fn(() => { calls.push("second"); return Result.Success(); }) });

        const result = new BatchCommand([first, second]).undo(editorFacade);

        expect(result.status).toBe(Result.Status.Success);
        expect(calls).toEqual(["second", "first"]);
    });

    it("returns an error when any child command fails and preserves messages", () => {
        const command = new BatchCommand([
            createCommand({ execute: vi.fn(() => ({ status: Result.Status.Success, message: "created", data: undefined }) as any) }),
            createCommand({ execute: vi.fn(() => ({ status: Result.Status.Error, message: "failed" }) as any) }),
        ]);

        expect(command.execute({} as any)).toEqual({
            status: Result.Status.Error,
            message: { key: "created\nfailed" },
            stacks: [],
        });
    });

    it("deletes every child command", () => {
        const first = createCommand();
        const second = createCommand();

        new BatchCommand([first, second]).delete();

        expect(first.delete).toHaveBeenCalledTimes(1);
        expect(second.delete).toHaveBeenCalledTimes(1);
    });
});
