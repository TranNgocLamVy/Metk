import { RulesetSessionManagerData } from "@/shared/schema/rulesetSessionSchema";
import { EditorContext } from "../application/editorContext";



export class RulesetSessionManager {
    private selectedRuleId: string | null = null;

    constructor(
        tilesetSessionManagerData: RulesetSessionManagerData,
        private readonly editorContext: EditorContext
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