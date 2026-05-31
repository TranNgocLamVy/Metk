import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { CreateRulesetPayload, RulesetData } from "@/shared/data-types/ruleset.data";
import { RulesetStorageService } from "@/infrastructure/container";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { FileDialogUtils } from "../utils/file-dialog.utils";
import { DialogService } from "./dialog.service";
import { createRulesetForm } from "../constant/form/create-ruleset.form";
import { WorkspaceService } from "./workspace.service";
import i18n from "@/shared/services/i18n.service";
import { Console } from "./console.service";
import { PathUtils } from "../utils/path.utils";
import { extractRulesetId, normalizeRulesetData } from "@/editor/model/ruleset/ruleset.normalizer";

export class RulesetService {

    public static async createRuleset(): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        const form = await DialogService.openFormDialog(createRulesetForm);
        if (!form) return;

        const defaultRulesetDir = currentWorkspace.savedPathManager.getRulesetDir();

        const rulesetAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.ruleset.title"), defaultPath: defaultRulesetDir, filters: [{ name: "Ruleset", extensions: ["rs.json"] }] });
        if (!rulesetAbsPath) return;

        const rulesetAbsDir = PathUtils.dirname(rulesetAbsPath);
        currentWorkspace.savedPathManager.setRulesetDir(rulesetAbsDir);

        const createRulesetPayload: CreateRulesetPayload = {
            id: uuidv4(),
            name: form.ruleset.name,
            color: form.ruleset.color,
            size: 5, // TODO: Handle 3x3, 7x7 and 9x9
        }
        
        let rulesetData: RulesetData
        try {
            rulesetData = normalizeRulesetData(createRulesetPayload);
        } catch (error) {
            Console.error({ message: "message.ruleset.createFail", stacks: [String(error)]});
            return;
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

        await editorFacade.projectManager.saveCurrrentProject();
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        Console.success({ message: "message.ruleset.createSuccess" });
    }

    public static async importRuleset(refRulesetId?: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

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

        let rulesetId: string;
        try {
            rulesetId = extractRulesetId(loadRulesetResult.data);
        } catch (error) {
            Console.error({
                message: "message.ruleset.importFail",
                stacks: [String(error)],
            });
            return Result.Error("message.ruleset.importFail");
        }

        if (refRulesetId && rulesetId !== refRulesetId) {
            Console.error({
                message: "message.ruleset.importFail",
                stacks: ["message.ruleset.mismatchId"]
            });
            return Result.Cancel();
        }

        const addRulesetResult = await currentProject.rulesetManager.addRuleset(loadRulesetResult.data, rulesetAbsPath);
        if (addRulesetResult.status !== Result.Status.Success) return addRulesetResult;

        await editorFacade.projectManager.saveCurrrentProject();

        Console.success({ message: "message.ruleset.importSuccess" });

        return Result.Success();
    }

    public static async removeRuleset(rulesetId: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;

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

        await editorFacade.projectManager.saveCurrrentProject();

        const rulesetSessionManager = editorFacade.currentWorkspace?.rulesetSessionManager;
        if (removeResult.status == Result.Status.Success && rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === rulesetId) rulesetSessionManager.setSelectedRuleId(null);
            await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }

        return removeResult
    }

    public static async deleteRuleset(rulesetId: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
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

        await appKernel.projectManager.saveCurrrentProject();

        const rulesetSessionManager = appKernel.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (rulesetSessionManager) {
            const selectedRuleId = rulesetSessionManager.getSelectedRuleId();
            if (selectedRuleId === rulesetId) rulesetSessionManager.setSelectedRuleId(null);
            await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }
    }
}
