import { beforeEach, describe, expect, it } from "vitest";

import { kernelMocks, resetStore } from "./store-test-utils";
import { useDialogStore } from "@/ui/stores/dialog.store";

const dialogConfig = { title: "Dialog" } as any;

describe("useDialogStore", () => {
    beforeEach(() => {
        resetStore(useDialogStore);
    });

    it("initializes with no open dialogs", () => {
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("opens a dialog, returns its id, and marks the modal flag open", () => {
        const id = useDialogStore.getState().openDialog("project-settings" as any, dialogConfig, { projectId: "p1" });

        expect(id).toBe("dialog-id-1");
        expect(useDialogStore.getState().dialogs).toEqual([
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
        const keepId = useDialogStore.getState().openDialog("keep" as any, dialogConfig);
        const closeId = useDialogStore.getState().openDialog("close" as any, dialogConfig);
        kernelMocks.appKernel.activationContext.setFlag.mockClear();

        useDialogStore.getState().closeDialog(closeId);

        expect(useDialogStore.getState().dialogs).toEqual([
            expect.objectContaining({ id: keepId }),
        ]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, closeId);
    });

    it("closes the top dialog when one is open", () => {
        const firstId = useDialogStore.getState().openDialog("first" as any, dialogConfig);
        useDialogStore.getState().openDialog("second" as any, dialogConfig);

        useDialogStore.getState().closeTopDialog();

        expect(useDialogStore.getState().dialogs).toEqual([
            expect.objectContaining({ id: "dialog-id-2" }),
        ]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, firstId);
    });

    it("does nothing when closing the top dialog with an empty stack", () => {
        useDialogStore.getState().closeTopDialog();

        expect(useDialogStore.getState().dialogs).toEqual([]);
        expect(kernelMocks.appKernel.activationContext.setFlag).not.toHaveBeenCalled();
    });

    it("closes all dialogs", () => {
        const firstId = useDialogStore.getState().openDialog("first" as any, dialogConfig);
        const secondId = useDialogStore.getState().openDialog("second" as any, dialogConfig);
        kernelMocks.appKernel.activationContext.setFlag.mockClear();

        useDialogStore.getState().closeAll();

        expect(useDialogStore.getState().dialogs).toEqual([]);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, firstId);
        expect(kernelMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", false, secondId);
    });
});
