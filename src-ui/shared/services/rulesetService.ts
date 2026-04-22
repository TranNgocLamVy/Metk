import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { RulesetMetadata, RulesetData } from "@/shared/schema/ruleSchema";
import { RulesetStorageService } from "@/infrastructure/container";
import { ToastService } from "./toastService";
import { appCore } from "@/core/appcore";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import { remove } from "@tauri-apps/plugin-fs";
import { DialogService } from "./dialogService";
import { createRulesetForm } from "../constant/form/createRulesetForm";
import { WorkspaceService } from "./workspaceService";

export class RulesetService {
    public static async createRuleset(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        if (!currentProject) return;

        const form = await DialogService.openFormDialog(createRulesetForm);
        if (!form) return;

        const rulesetAbsPath = await FileDialogUtils.saveFile({ title: "Save Tilemap", filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!rulesetAbsPath) return;

        const rulesetData: RulesetData = {
            id: uuidv4(),
            name: form.name,
            color: form.color,
            size: 5,
            rules: [],
            tilesets: [],
            rulesets: [],
        }

        const saveResult = await RulesetStorageService.save(rulesetAbsPath, rulesetData);
        if (saveResult.status !== Result.Status.Success) {
            ToastService.error({ message: saveResult.message });
            return;
        }

        const rulesetRefPath = PathUtils.relative(currentProject.projectPathSystem.absDir, rulesetAbsPath);
        const rulesetMetadata: RulesetMetadata = {
            id: rulesetData.id,
            name: rulesetData.name,
            color: rulesetData.color,
            rulesetRelPath: rulesetRefPath,
        }
        currentProject.rulesetManager.addRuleMetadata(rulesetMetadata);
        await editorContext.projectManager.saveCurrrentProject();

        useRulesetManagerStore.getState().refresh();

        ToastService.success({ message: "Ruleset created successfully" });
    }

    public static async deleteRuleset(id: string): Promise<void> {
        const rulesetManager = appCore.projectManager.currentProject?.rulesetManager;
        if (!rulesetManager) return;

        const rulesetMetadata = rulesetManager.getRulesetMetadataById(id);
        if (!rulesetMetadata) {
            ToastService.error({ message: `Ruleset not found` });
            return;
        }

        const confirmDelete = await DialogService.openPermissionDialog({ title: "Delete Ruleset", description: `Are you sure you want to delete "${rulesetMetadata.name}" Ruleset?`, okText: "Delete", okButtonVariant: "destructive", cancelText: "Cancel" });

        if (!confirmDelete) return;

        // TODO: move remove to Infrastructure layer
        remove(rulesetManager.getRulesetAbsById(id)!);
        
        rulesetManager.removeRule(id);
        await appCore.projectManager.saveCurrrentProject();

        useRulesetManagerStore.getState().refresh();

        const rulesetSessionManager = appCore.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === id) rulesetSessionManager.setSelectedRuleId(null);
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }

        ToastService.success({ message: "Ruleset deleted" });
    }
}