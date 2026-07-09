import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getConsoleStoreState, resetConsoleStoreForTest, setConsoleStoreStateForTest } from "@/ui/stores/console.store";

const createLog = (id: string) => ({ id, message: `Log ${id}` }) as any;
const createError = (id: string) => ({ id, message: `Error ${id}` }) as any;

describe("useConsoleStore", () => {
    beforeEach(() => {
        resetConsoleStoreForTest();
    });

    it("initializes with a closed log console and no messages", () => {
        expect(getConsoleStoreState()).toMatchObject({
            isConsoleOpen: false,
            consoleType: "log",
            logs: [],
            errors: [],
        });
    });

    it("toggles the console open state", () => {
        getConsoleStoreState().actions.toggleConsole();
        expect(getConsoleStoreState().isConsoleOpen).toBe(true);

        getConsoleStoreState().actions.toggleConsole();
        expect(getConsoleStoreState().isConsoleOpen).toBe(false);
    });

    it("opens and closes the console", () => {
        getConsoleStoreState().actions.openConsole();
        expect(getConsoleStoreState().isConsoleOpen).toBe(true);

        getConsoleStoreState().actions.closeConsole();
        expect(getConsoleStoreState().isConsoleOpen).toBe(false);
    });

    it("sets the active console type", () => {
        getConsoleStoreState().actions.setConsoleType("error");
        expect(getConsoleStoreState().consoleType).toBe("error");
    });

    it("opens with a console type when toggling from a closed state", () => {
        getConsoleStoreState().actions.toggleWithType("error");

        expect(getConsoleStoreState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
        });
    });

    it("closes when toggling the currently open console type", () => {
        setConsoleStoreStateForTest({ isConsoleOpen: true, consoleType: "log" });

        getConsoleStoreState().actions.toggleWithType("log");

        expect(getConsoleStoreState()).toMatchObject({
            isConsoleOpen: false,
            consoleType: "log",
        });
    });

    it("switches console type without closing when another type is open", () => {
        setConsoleStoreStateForTest({ isConsoleOpen: true, consoleType: "log" });

        getConsoleStoreState().actions.toggleWithType("error");

        expect(getConsoleStoreState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
        });
    });

    it("opens with the requested console type", () => {
        getConsoleStoreState().actions.openWithType("error");

        expect(getConsoleStoreState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
        });
    });

    it("adds logs, replaces duplicate log ids, and keeps the latest 200 logs", () => {
        getConsoleStoreState().actions.addLog(createLog("same"));
        getConsoleStoreState().actions.addLog({ ...createLog("same"), message: "Replacement" });

        expect(getConsoleStoreState().logs).toEqual([
            expect.objectContaining({ id: "same", message: "Replacement" }),
        ]);

        for (let index = 1; index <= 201; index += 1) {
            getConsoleStoreState().actions.addLog(createLog(`log-${index}`));
        }

        expect(getConsoleStoreState().logs).toHaveLength(200);
        expect(getConsoleStoreState().logs[0].id).toBe("log-2");
        expect(getConsoleStoreState().logs[getConsoleStoreState().logs.length - 1].id).toBe("log-201");
    });

    it("adds errors, replaces duplicate error ids, opens the error console, and keeps the latest 50 errors", () => {
        getConsoleStoreState().actions.addError(createError("same"));
        getConsoleStoreState().actions.addError({ ...createError("same"), message: "Replacement" });

        expect(getConsoleStoreState()).toMatchObject({
            isConsoleOpen: true,
            consoleType: "error",
            errors: [expect.objectContaining({ id: "same", message: "Replacement" })],
        });

        for (let index = 1; index <= 51; index += 1) {
            getConsoleStoreState().actions.addError(createError(`error-${index}`));
        }

        expect(getConsoleStoreState().errors).toHaveLength(50);
        expect(getConsoleStoreState().errors[0].id).toBe("error-2");
        expect(getConsoleStoreState().errors[getConsoleStoreState().errors.length - 1].id).toBe("error-51");
    });

    it("removes a log by id", () => {
        getConsoleStoreState().actions.addLog(createLog("keep"));
        getConsoleStoreState().actions.addLog(createLog("remove"));

        getConsoleStoreState().actions.removeLog("remove");

        expect(getConsoleStoreState().logs).toEqual([expect.objectContaining({ id: "keep" })]);
    });

    it("removes an error by id", () => {
        getConsoleStoreState().actions.addError(createError("keep"));
        getConsoleStoreState().actions.addError(createError("remove"));

        getConsoleStoreState().actions.removeError("remove");

        expect(getConsoleStoreState().errors).toEqual([expect.objectContaining({ id: "keep" })]);
    });

    it("clears logs", () => {
        getConsoleStoreState().actions.addLog(createLog("log"));

        getConsoleStoreState().actions.clearLogs();

        expect(getConsoleStoreState().logs).toEqual([]);
    });

    it("clears errors", () => {
        getConsoleStoreState().actions.addError(createError("error"));

        getConsoleStoreState().actions.clearErrors();

        expect(getConsoleStoreState().errors).toEqual([]);
    });

    it("clears logs and errors together", () => {
        getConsoleStoreState().actions.addLog(createLog("log"));
        getConsoleStoreState().actions.addError(createError("error"));

        getConsoleStoreState().actions.clearAll();

        expect(getConsoleStoreState()).toMatchObject({
            logs: [],
            errors: [],
        });
    });
});
