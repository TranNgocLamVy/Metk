import { FormUtils } from "@/shared/utils/formUtils"

export const createATRulesetForm = FormUtils.createForm({
    title: "Create new Ruleset",
    okText: "Create",
    cancelText: "Cancel",
    size: "sm",
    inputs: [
        {
            id: "name",
            name: "name",
            type: "text",
            label: "Ruleset Name",
            placeholder: "New Ruleset",
            required: true,
        },
        {
            id: "color",
            name: "color",
            type: "color",
            label: "Ruleset Color",
            defaultValue: "#ffffff",
        }
    ],
    async validateBeforeSubmit(values) {
        // TODO: validate
        return { valid: true }
    },
})