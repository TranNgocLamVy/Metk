import { FormUtils } from "@/shared/utils/form.utils";
import { PathUtils } from "@/shared/utils/path.utils";
import { exists } from "@tauri-apps/plugin-fs";

export const createProjectForm = () => {
    return FormUtils.createForm({
        title: "form.project.title",
        okText: "form.project.action.create",
        cancelText: "form.project.action.cancel",
        size: "sm",
        inputs: [
            {
                id: "name",
                name: "name",
                type: "text",
                label: "form.project.name.label",
                placeholder: "form.project.name.placeholder",
                required: true,
            },
            {
                id: "destination",
                name: "destination",
                type: "folderPath",
                label: "form.project.destination.label",
                placeholder: "form.project.destination.placeholder",
                required: true,
            }
        ],
        async validateBeforeSubmit(values) {
            const path = PathUtils.join(values.destination, values.name);
            const isExists = await exists(path);
            if (isExists) {
                return { valid: false, message: "form.project.message.folderExists" }
            }
            return { valid: true }
        },
    })
}