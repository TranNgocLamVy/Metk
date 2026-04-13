import { Application } from "pixi.js";
import { ATRuleset } from "../atrule/atRuleset";
import { ATRule } from "../atrule/atRule";
import { EditorContext } from "../editorContext";
import { RulesetOutputSelector } from "../renderer/rulesetOutputSelector";

export class ATRulesetSession {
    public readonly ruleset: ATRuleset;
    public selectedRuleId: string | null = null;
    public renderer: RulesetOutputSelector = null!;
    public pixiApp: Application | null = null;

    constructor(
        ruleset: ATRuleset, 
        public readonly editorContext: EditorContext
    ) {
        this.ruleset = ruleset;
        this.renderer = new RulesetOutputSelector(this.ruleset);
    }

    public activateSession(pixiApp: Application) {
        this.pixiApp = pixiApp;
        this.renderer.activatePixiApp(pixiApp);
    }

    public deactivateSession() {
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null!;
        }
    }

    public setSelectedRule(ruleId: string | null) {
        this.selectedRuleId = ruleId;
    }

    public getSelectedRule(): ATRule | null {
        if (!this.selectedRuleId) return null;
        return this.ruleset.getRule(this.selectedRuleId);
    }

    public destroy() {
        this.deactivateSession();
    }
}