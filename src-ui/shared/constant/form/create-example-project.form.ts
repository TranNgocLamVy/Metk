import { PathUtils } from "@/shared/utils/path.utils";
import { createForm } from "./form.utils";

type CreateExampleProjectFormDependencies = {
    fileSystem: {
        exists(path: string): Promise<boolean>;
    };
    defaultName: string;
};

export const createExampleProjectForm = ({ fileSystem, defaultName }: CreateExampleProjectFormDependencies) => {
    return createForm({
        title: "form.exampleProject.title",
        description: "form.exampleProject.description",
        okText: "form.exampleProject.action.create",
        cancelText: "form.exampleProject.action.cancel",
        size: "sm",
        inputs: [
            {
                id: "name",
                name: "name",
                type: "text",
                label: "form.exampleProject.name.label",
                placeholder: "form.exampleProject.name.placeholder",
                defaultValue: defaultName,
                required: true,
            },
            {
                id: "destination",
                name: "destination",
                type: "folderPath",
                label: "form.exampleProject.destination.label",
                placeholder: "form.exampleProject.destination.placeholder",
                required: true,
            },
        ],
        async validateBeforeSubmit(values) {
            const path = PathUtils.join(values.destination, values.name);
            const isExists = await fileSystem.exists(path);
            if (isExists) {
                return { valid: false, message: "form.project.message.folderExists" };
            }
            return { valid: true };
        },
    });
};
