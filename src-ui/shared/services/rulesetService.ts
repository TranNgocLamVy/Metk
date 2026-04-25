import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { RulesetMetadata, RulesetData } from "@/shared/schema/rulesetSchema";
import { RulesetStorageService } from "@/infrastructure/container";
import { appCore } from "@/core/appcore";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import { DialogService } from "./dialogService";
import { createRulesetForm } from "../constant/form/createRulesetForm";
import { WorkspaceService } from "./workspaceService";
import i18n from "@/core/service/i18n";
import { Console } from "./consoleService";

export class RulesetService {

    public static async createRuleset(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        const form = await DialogService.openFormDialog(createRulesetForm);
        if (!form) return;

        let defaultRulesetDir: string;
        const savedRulesetDir = currentWorkspace.savedPathManager.getRulesetDir();
        if (savedRulesetDir) {
            defaultRulesetDir = savedRulesetDir;
        } else {
            defaultRulesetDir = currentProject.projectPathSystem.absDir;
        }

        const rulesetAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.ruleset.title"), defaultPath: defaultRulesetDir, filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!rulesetAbsPath) return;

        const rulesetData: RulesetData = {
            id: uuidv4(),
            name: form.name,
            color: form.color,
            size: 5,
            rules: [],
            tilesets: { refs: [], nextIndex: 0 },
            rulesets: { refs: [], nextIndex: 0 },
        }

        const saveResult = await RulesetStorageService.save(rulesetAbsPath, rulesetData);
        if (saveResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.ruleset.saveFail",
                stacks: saveResult.message ? [saveResult.message] : [],
            })
            return;
        }

        await currentProject.rulesetManager.addRuleset(rulesetData, rulesetAbsPath);

        await editorContext.projectManager.saveCurrrentProject();

        useRulesetManagerStore.getState().refresh();

        Console.success({message: "message.ruleset.createSuccess"});
    }

    public static async importRuleset(refRulesetId?: string): Promise<Result> {
        const rulesetAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!rulesetAbsPath) return Result.Cancel();
        const loadRulesetResult = await RulesetStorageService.load(rulesetAbsPath);
        if (loadRulesetResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.ruleset.loadFail",
                stacks: [loadRulesetResult.message!, ...loadRulesetResult.stacks!]
            })
            return Result.Error(loadRulesetResult.message);
        }

        const rulesetData = loadRulesetResult.data;
        if (refRulesetId && rulesetData.id !== refRulesetId) {
            Console.error({
                message: "message.ruleset.importFail",
                stacks: ["message.ruleset.mismatchId"]
            });
            return Result.Cancel();
        }

        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        await currentProject.rulesetManager.addRuleset(rulesetData, rulesetAbsPath);

        await editorContext.projectManager.saveCurrrentProject();

        useRulesetManagerStore.getState().refresh();

        Console.success({message: "message.ruleset.importSuccess"});

        return Result.Success();
    }

    public static async removeRuleset(id: string): Promise<Result> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        const removeResult = await currentProject.rulesetManager.removeRulesetMetadata(id);
        const rulesetSessionManager = appCore.workspaceManager.currentWorkspace?.rulesetSessionManager;

        // TODO: Remove ref from tilemap

        useRulesetManagerStore.getState().refresh();

        if (removeResult.status == Result.Status.Success && rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === id) rulesetSessionManager.setSelectedRuleId(null);
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }
        return removeResult
    }

    public static async deleteRuleset(id: string): Promise<void> {
        const rulesetManager = appCore.projectManager.currentProject?.rulesetManager;
        if (!rulesetManager) return;

        const confirmDelete = await DialogService.openPermissionDialog({ 
            title: "dialog.delete.ruleset.title",
            description: "dialog.delete.ruleset.description", 
        });

        if (!confirmDelete) return;

        await rulesetManager.deleteRuleset(id);
        await appCore.projectManager.saveCurrrentProject();

        // TODO: Remove ref from tilemap

        useRulesetManagerStore.getState().refresh();

        const rulesetSessionManager = appCore.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === id) rulesetSessionManager.setSelectedRuleId(null);
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }
    }
}