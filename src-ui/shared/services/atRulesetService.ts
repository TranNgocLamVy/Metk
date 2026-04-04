import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { ATRulesetMetadata, ATRulesetData } from "@/shared/schema/atRuleSchema";
import { ATRulesetStorageService } from "@/infrastructure/container";
import { ToastService } from "./toastService";
import { AppCore } from "@/core/appcore";
import { createATRulesetForm } from "@/view/components/form/atRulesetForm";
import { FormService } from "./formService";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { useATRulesetManagerStore } from "@/view/stores/application/atRulesetManagerStore";
import { remove } from "@tauri-apps/plugin-fs";
import { DialogService } from "./dialogService";

export class ATRulesetService {
    public static async createATRuleset(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const currentProject = editorContext.getCurrentProject();

        const form = await FormService.openFormDialog(createATRulesetForm);
        if (!form) return;

        const atRulesetAbsPath = await FileDialogUtils.saveFile({ title: "Save Tilemap", filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!atRulesetAbsPath) return;

        const atRulesetData: ATRulesetData = {
            id: uuidv4(),
            name: form.name,
            color: form.color,
            rules: [],
            tilesets: [],
            rulesets: [],
        }

        const saveResult = await ATRulesetStorageService.save(atRulesetAbsPath, atRulesetData);
        if (saveResult.status !== Result.Status.Success) {
            ToastService.error({ message: saveResult.message });
            return;
        }

        const atRulesetRefPath = PathUtils.relative(currentProject.projectPathSystem.absDir, atRulesetAbsPath);
        const atRulesetMetadata: ATRulesetMetadata = {
            id: atRulesetData.id,
            name: atRulesetData.name,
            color: atRulesetData.color,
            atRulesetRelPath: atRulesetRefPath,
        }
        currentProject.atRulesetManager.addAtRuleMetadata(atRulesetMetadata);
        await editorContext.projectManager.saveCurrrentProject();

        useATRulesetManagerStore.getState().refresh();

        ToastService.success({ message: "Ruleset created successfully" });
    }

    public static async deleteATRuleset(id: string): Promise<void> {
        const atRulesetManager = AppCore.getIns().projectManager.currentProject?.atRulesetManager;
        if (!atRulesetManager) return;

        const atRulesetMetadata = atRulesetManager.getAtRulesetMetadataById(id);
        if (!atRulesetMetadata) {
            ToastService.error({ message: `Ruleset not found` });
            return;
        }

        const confirmDelete = await DialogService.openPermissionDialog({ title: "Delete Ruleset", description: `Are you sure you want to delete "${atRulesetMetadata.name}" Ruleset?`, okText: "Delete", okButtonVariant: "destructive", cancelText: "Cancel" });

        if (!confirmDelete) return;

        // TODO: move remove to Infrastructure layer
        remove(atRulesetManager.getAtRulesetAbsById(id)!);
        
        atRulesetManager.removeAtRule(id);
        await AppCore.getIns().projectManager.saveCurrrentProject();

        useATRulesetManagerStore.getState().refresh();

        ToastService.success({ message: "Ruleset deleted" });
    }
}