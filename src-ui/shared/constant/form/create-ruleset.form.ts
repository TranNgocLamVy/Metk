import { createForm } from "./form.utils"

export const createRulesetForm = createForm({
    title: "form.ruleset.title",
    okText: "form.ruleset.action.create",
    cancelText: "form.ruleset.action.cancel",
    size: "sm",
    inputs: [
        {
            id: "ruleset",
            name: "ruleset",
            type: "group",
            label: "form.ruleset.ruleset",
            inputs: [
                {
                    id: "name",
                    name: "name",
                    type: "text",
                    label: "form.ruleset.name.label",
                    placeholder: "form.ruleset.name.placeholder",
                    required: true,
                },
                {
                    id: "color",
                    name: "color",
                    type: "color",
                    label: "form.ruleset.color.label",
                    defaultValue: "#ffffff",
                }
            ],
        },
        
        // TODO: Add size
    ],
    async validateBeforeSubmit(values) {
        return { valid: true }
    },
})