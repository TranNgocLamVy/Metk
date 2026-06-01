import { createForm } from "./form.utils";

export const createEntityCollectionForm = createForm({
    title: "form.entityCollection.title",
    okText: "form.entityCollection.action.create",
    cancelText: "form.entityCollection.action.cancel",
    size: "sm",
    inputs: [
        {
            id: "entityCollection",
            name: "entityCollection",
            type: "group",
            label: "form.entityCollection.entityCollection",
            inputs: [
                {
                    id: "name",
                    name: "name",
                    type: "text",
                    label: "form.entityCollection.name.label",
                    placeholder: "form.entityCollection.name.placeholder",
                    required: true,
                },
            ],
        },
    ],
    async validateBeforeSubmit() {
        return { valid: true };
    },
});