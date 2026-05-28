import { beforeEach, describe, expect, it, vi } from "vitest";

const dialogMocks = vi.hoisted(() => {
    let uuidCounter = 0;

    return {
        resetUuid: () => {
            uuidCounter = 0;
        },
        uuid: vi.fn(() => {
            uuidCounter += 1;
            return `dialog-id-${uuidCounter}`;
        }),
        appKernel: {
            activationContext: {
                setFlag: vi.fn(),
            },
            editorFacade: {
                currentProject: null as any,
            },
        },
    };
});

vi.mock("uuid", () => ({ v4: dialogMocks.uuid }));
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: dialogMocks.appKernel }));

import { DialogService } from "@/shared/services/dialog.service";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/ui/stores/dialog.store";

beforeEach(() => {
    useDialogStore.setState(useDialogStore.getInitialState(), true);
    dialogMocks.resetUuid();
    dialogMocks.uuid.mockClear();
    dialogMocks.appKernel.activationContext.setFlag.mockClear();
    dialogMocks.appKernel.editorFacade.currentProject = null;
});

describe("DialogService", () => {
    it("opens a form dialog and resolves with submitted form data", async () => {
        const promise = DialogService.openFormDialog({
            title: "Create Tilemap",
            inputs: [
                { id: "name", name: "name", type: "text", label: "Name" },
            ],
        });

        const dialog = useDialogStore.getState().dialogs[0];
        expect(dialog).toMatchObject({
            id: "dialog-id-1",
            type: "FORM_DIALOG",
            config: { zLevel: DialogZLevel.Modal },
        });
        expect(dialogMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", true, "dialog-id-1");

        (dialog.params as any).resolve({ name: "Overworld" });

        await expect(promise).resolves.toEqual({ name: "Overworld" });
    });

    it("opens permission and save dialogs with alert z-levels and preserves user decisions", async () => {
        const permissionPromise = DialogService.openPermissionDialog({ title: "Remove", description: "Remove project?" });
        const savePromise = DialogService.openSaveDialog({ title: "Unsaved", description: "Save first?" });

        const [permissionDialog, saveDialog] = useDialogStore.getState().dialogs;
        expect(permissionDialog).toMatchObject({
            id: "dialog-id-1",
            type: "PERMISSION_DIALOG",
            config: { zLevel: DialogZLevel.AlertDialog },
        });
        expect(saveDialog).toMatchObject({
            id: "dialog-id-2",
            type: "SAVE_DIALOG",
            config: { zLevel: DialogZLevel.AlertDialog },
        });

        (permissionDialog.params as any).resolve(false);
        (saveDialog.params as any).resolve("cancel");

        await expect(permissionPromise).resolves.toBe(false);
        await expect(savePromise).resolves.toBe("cancel");
    });

    it("loads a ruleset before opening the edit ruleset dialog", async () => {
        const rulesetManager = {
            loadRuleset: vi.fn().mockResolvedValue({ id: "ruleset-a" }),
        };
        dialogMocks.appKernel.editorFacade.currentProject = { rulesetManager };

        await DialogService.openEditRulesetDialog("ruleset-a");

        expect(rulesetManager.loadRuleset).toHaveBeenCalledWith("ruleset-a");
        expect(useDialogStore.getState().dialogs[0]).toMatchObject({
            id: "dialog-id-1",
            type: "EDIT_RULESET_MODAL",
            params: { rulesetId: "ruleset-a" },
            config: { zLevel: DialogZLevel.Modal },
        });
    });

    it("does not open the edit ruleset dialog when no project or ruleset is available", async () => {
        await DialogService.openEditRulesetDialog("ruleset-a");
        expect(useDialogStore.getState().dialogs).toEqual([]);

        dialogMocks.appKernel.editorFacade.currentProject = {
            rulesetManager: {
                loadRuleset: vi.fn().mockResolvedValue(null),
            },
        };

        await DialogService.openEditRulesetDialog("ruleset-a");
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });
});
