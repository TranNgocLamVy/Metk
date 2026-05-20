import { beforeEach, describe, expect, it, vi } from "vitest";

const decoratorMocks = vi.hoisted(() => ({
    consoleService: {
        error: vi.fn(),
    },
}));

vi.mock("@/shared/services/console.service", () => ({ Console: decoratorMocks.consoleService }));

import { CatchError } from "@/shared/decorator/catch-result-error.decorator";
import { Result } from "@/shared/types/result";

class DecoratedHarness {
    public syncSuccess(value: string) {
        return `saved:${value}`;
    }

    public async asyncSuccess(value: string) {
        return Result.Success(`loaded:${value}`);
    }

    public syncFailure() {
        throw new Error("sync exploded");
    }

    public async asyncFailure() {
        throw new Error("async exploded");
    }
}

const applyCatchError = (methodName: keyof DecoratedHarness, message = "message.test.fallback") => {
    const descriptor = Object.getOwnPropertyDescriptor(DecoratedHarness.prototype, methodName)!;
    CatchError(message)(DecoratedHarness.prototype, methodName as string, descriptor);
    Object.defineProperty(DecoratedHarness.prototype, methodName, descriptor);
};

describe("CatchError decorator", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("passes through successful synchronous method results", () => {
        applyCatchError("syncSuccess");
        const harness = new DecoratedHarness();

        expect(harness.syncSuccess("project")).toBe("saved:project");
        expect(decoratorMocks.consoleService.error).not.toHaveBeenCalled();
    });

    it("passes through successful asynchronous method results", async () => {
        applyCatchError("asyncSuccess");
        const harness = new DecoratedHarness();

        await expect(harness.asyncSuccess("workspace")).resolves.toEqual(Result.Success("loaded:workspace"));
        expect(decoratorMocks.consoleService.error).not.toHaveBeenCalled();
    });

    it("converts synchronous thrown errors to Result.Error with the fallback key", () => {
        applyCatchError("syncFailure", "message.sync.fallback");
        const harness = new DecoratedHarness();

        expect(harness.syncFailure()).toEqual(Result.Error("message.sync.fallback"));
        expect(console.error).toHaveBeenCalledWith("DecoratedHarness.syncFailure] Sync Error:", expect.any(Error));
    });

    it("converts asynchronous thrown errors to Result.Error and reports stack context to the console service", async () => {
        applyCatchError("asyncFailure", "message.async.fallback");
        const harness = new DecoratedHarness();

        await expect(harness.asyncFailure()).resolves.toEqual(Result.Error("message.async.fallback"));
        expect(console.error).toHaveBeenCalledWith("[DecoratedHarness.asyncFailure] Async Error:", expect.any(Error));
        expect(decoratorMocks.consoleService.error).toHaveBeenCalledWith({
            message: "message.async.fallback",
            stacks: ["Error: async exploded"],
        });
    });
});
