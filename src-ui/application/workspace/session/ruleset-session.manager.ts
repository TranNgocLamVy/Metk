import { RulesetSessionManagerData } from "@/shared/data-types/ruleset-session.data";
import { EditorFacade } from "@/application/editor.facade";



export class RulesetSessionManager {
    private selectedRuleId: string | null = null;

    constructor(
        tilesetSessionManagerData: RulesetSessionManagerData,
        private readonly editorFacade: EditorFacade
    ) {
        this.selectedRuleId = tilesetSessionManagerData.selectedRuleId;
    }

    public getSelectedRuleId(): string | null {
        return this.selectedRuleId;
    }

    public setSelectedRuleId(ruleId: string | null) {
        this.selectedRuleId = ruleId;
    }

    public serialize(): RulesetSessionManagerData {
        return {
            selectedRuleId: this.selectedRuleId,
        }
    }
}