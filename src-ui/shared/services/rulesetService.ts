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

        Console.success({message: "message.ruleset.createSuccess"});
    }

    public static async deleteRuleset(id: string): Promise<void> {
        const rulesetManager = appCore.projectManager.currentProject?.rulesetManager;
        if (!rulesetManager) return;

        const rulesetMetadata = rulesetManager.getRulesetMetadataById(id);
        if (!rulesetMetadata) {
            Console.error({
                message: "message.ruleset.deleteFail",
                stacks: ["message.ruleset.notFound"],
            })
            return;
        }

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

        Console.log({ message: "message.ruleset.deleteSuccess"});
    }
}