import { Application } from "pixi.js";
import { Ruleset } from "../rule/ruleset";
import { Rule } from "../rule/rule";
import { EditorContext } from "../editorContext";
import { RulesetOutputSelector } from "../renderer/rulesetOutputSelector";

export class RulesetSession {
    public readonly ruleset: Ruleset;
    public selectedRuleId: string | null = null;
    public renderer: RulesetOutputSelector = null!;
    public pixiApp: Application | null = null;

    constructor(
        ruleset: Ruleset, 
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

    public getSelectedRule(): Rule | null {
        if (!this.selectedRuleId) return null;
        return this.ruleset.getRule(this.selectedRuleId);
    }

    public destroy() {
        this.deactivateSession();
    }
}