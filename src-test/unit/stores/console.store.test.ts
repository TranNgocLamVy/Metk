import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useConsoleStore } from "@/ui/stores/console.store";

const createLog = (id: string) => ({ id, message: `Log ${id}` }) as any;
const createError = (id: string) => ({ id, message: `Error ${id}` }) as any;

describe("useConsoleStore", () => {
    beforeEach(() => {
        resetStore(useConsoleStore);
    });

    it("initializes with a closed log console and no messages", () => {
        expect(useConsoleStore.getState()).toMatchObject({
            isConsoleOpen: false,
            consoleType: "log",
            logs: [],
            errors: [],
        });
    });

    it("toggles the console open state", () => {
        useConsoleStore.getState().toggleConsole();
        expect(useConsoleStore.getState().isConsoleOpen).toBe(true);

        useConsoleStore.getState().toggleConsole();
        expect(useConsoleStore.getState().isConsoleOpen).toBe(false);
    });

    it("opens and closes the console", () => {
        useConsoleStore.getState().openConsole();
        expect(useConsoleStore.getState().isConsoleOpen).toBe(true);

        useConsoleStore.getState().closeConsole();
        expect(useConsoleStore.getState().isConsoleOpen).toBe(false);
    });

    it("sets the active console type", () => {
        useConsoleStore.getState().setConsoleType("error");
        expect(useConsoleStore.getState().consoleType).toBe("error");
    });

    it("opens with a console type when toggling from a closed state", () => {
        useConsoleStore.getState().toggleWithType("error");

        expect(useConsoleStore.getState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
        });
    });

    it("closes when toggling the currently open console type", () => {
        useConsoleStore.setState({ isConsoleOpen: true, consoleType: "log" });

        useConsoleStore.getState().toggleWithType("log");

        expect(useConsoleStore.getState()).toMatchObject({
            isConsoleOpen: false,
            consoleType: "log",
        });
    });

    it("switches console type without closing when another type is open", () => {
        useConsoleStore.setState({ isConsoleOpen: true, consoleType: "log" });

        useConsoleStore.getState().toggleWithType("error");

        expect(useConsoleStore.getState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
        });
    });

    it("opens with the requested console type", () => {
        useConsoleStore.getState().openWithType("error");

        expect(useConsoleStore.getState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
        });
    });

    it("adds logs, replaces duplicate log ids, and keeps the latest 200 logs", () => {
        useConsoleStore.getState().addLog(createLog("same"));
        useConsoleStore.getState().addLog({ ...createLog("same"), message: "Replacement" });

        expect(useConsoleStore.getState().logs).toEqual([
            expect.objectContaining({ id: "same", message: "Replacement" }),
        ]);

        for (let index = 1; index <= 201; index += 1) {
            useConsoleStore.getState().addLog(createLog(`log-${index}`));
        }

        expect(useConsoleStore.getState().logs).toHaveLength(200);
        expect(useConsoleStore.getState().logs[0].id).toBe("log-2");
        expect(useConsoleStore.getState().logs[useConsoleStore.getState().logs.length - 1].id).toBe("log-201");
    });

    it("adds errors, replaces duplicate error ids, opens the error console, and keeps the latest 50 errors", () => {
        useConsoleStore.getState().addError(createError("same"));
        useConsoleStore.getState().addError({ ...createError("same"), message: "Replacement" });

        expect(useConsoleStore.getState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
            errors: [expect.objectContaining({ id: "same", message: "Replacement" })],
        });

        for (let index = 1; index <= 51; index += 1) {
            useConsoleStore.getState().addError(createError(`error-${index}`));
        }

        expect(useConsoleStore.getState().errors).toHaveLength(50);
        expect(useConsoleStore.getState().errors[0].id).toBe("error-2");
        expect(useConsoleStore.getState().errors[useConsoleStore.getState().errors.length - 1].id).toBe("error-51");
    });

    it("removes a log by id", () => {
        useConsoleStore.getState().addLog(createLog("keep"));
        useConsoleStore.getState().addLog(createLog("remove"));

        useConsoleStore.getState().removeLog("remove");

        expect(useConsoleStore.getState().logs).toEqual([expect.objectContaining({ id: "keep" })]);
    });

    it("removes an error by id", () => {
        useConsoleStore.getState().addError(createError("keep"));
        useConsoleStore.getState().addError(createError("remove"));

        useConsoleStore.getState().removeError("remove");

        expect(useConsoleStore.getState().errors).toEqual([expect.objectContaining({ id: "keep" })]);
    });

    it("clears logs", () => {
        useConsoleStore.getState().addLog(createLog("log"));

        useConsoleStore.getState().clearLogs();

        expect(useConsoleStore.getState().logs).toEqual([]);
    });

    it("clears errors", () => {
        useConsoleStore.getState().addError(createError("error"));

        useConsoleStore.getState().clearErrors();

        expect(useConsoleStore.getState().errors).toEqual([]);
    });

    it("clears logs and errors together", () => {
        useConsoleStore.getState().addLog(createLog("log"));
        useConsoleStore.getState().addError(createError("error"));

        useConsoleStore.getState().clearAll();

        expect(useConsoleStore.getState()).toMatchObject({
            logs: [],
            errors: [],
        });
    });
});
