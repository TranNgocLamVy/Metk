import { FormService } from "@/shared/services/formService";

export const createATRulesetForm = FormService.createForm({
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
        return { valid: true }
    },
})