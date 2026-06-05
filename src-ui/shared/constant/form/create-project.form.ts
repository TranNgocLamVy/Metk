import { PathUtils } from "@/shared/utils/path.utils";
import { createForm } from "./form.utils";

type CreateProjectFormDependencies = {
    fileSystem: {
        exists(path: string): Promise<boolean>;
    };
};

export const createProjectForm = ({ fileSystem }: CreateProjectFormDependencies) => {
    return createForm({
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
            const isExists = await fileSystem.exists(path);
            if (isExists) {
                return { valid: false, message: "form.project.message.folderExists" }
            }
            return { valid: true }
        },
    })
}
