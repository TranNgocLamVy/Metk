import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { RulesetData } from "@/shared/schema/rulesetSchema";
import { RulesetStorageService } from "@/infrastructure/container";
import { appCore } from "@/core/appcore";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { useRulesetStore } from "@/view/stores/rulesetStore";
import { DialogService } from "./dialogService";
import { createRulesetForm } from "../constant/form/createRulesetForm";
import { WorkspaceService } from "./workspaceService";
import i18n from "@/core/service/i18n";
import { Console } from "./consoleService";
import { PathUtils } from "../utils/pathUtils";

export class RulesetService {

    public static async createRuleset(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        const form = await DialogService.openFormDialog(createRulesetForm);
        if (!form) return;

        const defaultRulesetDir = currentWorkspace.savedPathManager.getRulesetDir();

        const rulesetAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.ruleset.title"), defaultPath: defaultRulesetDir, filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!rulesetAbsPath) return;

        const rulesetAbsDir = PathUtils.dirname(rulesetAbsPath);
        currentWorkspace.savedPathManager.setRulesetDir(rulesetAbsDir);

        const rulesetData: RulesetData = {
            id: uuidv4(),
            name: form.name,
            color: form.color,
            size: 5, // TODO: Handle 3x3, 7x7 and 9x9
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
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        Console.success({ message: "message.ruleset.createSuccess" });
    }

    public static async importRuleset(refRulesetId?: string): Promise<Result> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        const defaultRulesetDir = currentWorkspace.savedPathManager.getRulesetDir();

        const rulesetAbsPath = await FileDialogUtils.open({ defaultPath: defaultRulesetDir, multiple: false, filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!rulesetAbsPath) return Result.Cancel();

        const loadRulesetResult = await RulesetStorageService.load(rulesetAbsPath);
        if (loadRulesetResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.ruleset.importFail",
                stacks: [loadRulesetResult.message!, ...loadRulesetResult.stacks!]
            })
            return Result.Error(loadRulesetResult.message);
        }

        const rulesetAbsDir = PathUtils.dirname(rulesetAbsPath);
        currentWorkspace.savedPathManager.setRulesetDir(rulesetAbsDir);

        const rulesetData = loadRulesetResult.data;
        if (refRulesetId && rulesetData.id !== refRulesetId) {
            Console.error({
                message: "message.ruleset.importFail",
                stacks: ["message.ruleset.mismatchId"]
            });
            return Result.Cancel();
        }

        await currentProject.rulesetManager.addRuleset(rulesetData, rulesetAbsPath);

        await editorContext.projectManager.saveCurrrentProject();

        Console.success({ message: "message.ruleset.importSuccess" });

        return Result.Success();
    }

    public static async removeRuleset(rulesetId: string): Promise<Result> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;

        if (!currentProject) return Result.Cancel();

        const confirmRemoval = await DialogService.openPermissionDialog({
            title: "dialog.remove.ruleset.title",
            description: "dialog.remove.ruleset.description",
        });
        if (!confirmRemoval) return Result.Cancel();

        const removeResult = await currentProject.rulesetManager.removeRuleset(rulesetId);

        await Promise.all([
            currentProject.tilemapManager.removeRulesetRef(rulesetId),
            currentProject.rulesetManager.removeRulesetRef(rulesetId)
        ])

        if (removeResult.status !== Result.Status.Success) return Result.Cancel();

        await editorContext.projectManager.saveCurrrentProject();

        const rulesetSessionManager = editorContext.currentWorkspace?.rulesetSessionManager;
        if (removeResult.status == Result.Status.Success && rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === rulesetId) rulesetSessionManager.setSelectedRuleId(null);
            await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }

        return removeResult
    }

    public static async deleteRuleset(rulesetId: string): Promise<void> {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return;
        const rulesetManager = currentProject.rulesetManager;

        const confirmDeletion = await DialogService.openPermissionDialog({
            title: "dialog.delete.ruleset.title",
            description: "dialog.delete.ruleset.description",
        });
        if (!confirmDeletion) return;

        const deleteResult = await rulesetManager.deleteRuleset(rulesetId);

        await Promise.all([
            currentProject.tilemapManager.removeRulesetRef(rulesetId),
            currentProject.rulesetManager.removeRulesetRef(rulesetId)
        ])

        if (deleteResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.ruleset.deleteFail",
                stacks: deleteResult.message ? [deleteResult.message] : [],
            })
            return;
        }

        await appCore.projectManager.saveCurrrentProject();

        const rulesetSessionManager = appCore.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === rulesetId) rulesetSessionManager.setSelectedRuleId(null);
            await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }
    }
}