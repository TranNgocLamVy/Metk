import { beforeEach, describe, expect, it } from "vitest";

import { kernelMocks, resetStore } from "./store-test-utils";
import { getDialogStoreState, resetDialogStoreForTest, setDialogStoreStateForTest } from "@/ui/stores/dialog.store";

const dialogConfig = { title: "Dialog" } as any;

describe("useDialogStore", () => {
    beforeEach(() => {
        resetDialogStoreForTest();
    });

    it("initializes with no open dialogs", () => {
        expect(getDialogStoreState().dialogs).toEqual([]);
    });

    it("opens a dialog, returns its id, and marks the modal flag open", () => {
        const id = getDialogStoreState().actions.openDialog("project-settings" as any, dialogConfig, { projectId: "p1" });

        expect(id).toBe("dialog-id-1");
        expect(getDialogStoreState().dialogs).toEqual([
            {
                id: "dialog-id-1",
                type: "project-settings",
                params: { projectId: "p1" },
                config: dialogConfig,
            },
        ]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", true, "dialog-id-1");
    });

    it("closes a dialog by id and marks the modal flag closed", () => {
        const keepId = getDialogStoreState().actions.openDialog("keep" as any, dialogConfig);
        const closeId = getDialogStoreState().actions.openDialog("close" as any, dialogConfig);
        kernelMocks.appKernel.activationContext.setFlag.mockClear();

        getDialogStoreState().actions.closeDialog(closeId);

        expect(getDialogStoreState().dialogs).toEqual([
            expect.objectContaining({ id: keepId }),
        ]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, closeId);
    });

    it("closes the top dialog when one is open", () => {
        const firstId = getDialogStoreState().actions.openDialog("first" as any, dialogConfig);
        getDialogStoreState().actions.openDialog("second" as any, dialogConfig);

        getDialogStoreState().actions.closeTopDialog();

        expect(getDialogStoreState().dialogs).toEqual([
            expect.objectContaining({ id: "dialog-id-2" }),
        ]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, firstId);
    });

    it("does nothing when closing the top dialog with an empty stack", () => {
        getDialogStoreState().actions.closeTopDialog();

        expect(getDialogStoreState().dialogs).toEqual([]);
        expect(kernelMocks.appKernel.activationContext.setFlag).not.toHaveBeenCalled();
    });

    it("closes all dialogs", () => {
        const firstId = getDialogStoreState().actions.openDialog("first" as any, dialogConfig);
        const secondId = getDialogStoreState().actions.openDialog("second" as any, dialogConfig);
        kernelMocks.appKernel.activationContext.setFlag.mockClear();

        getDialogStoreState().actions.closeAll();

        expect(getDialogStoreState().dialogs).toEqual([]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, firstId);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, secondId);
    });
});
