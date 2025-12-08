import { FormService } from "@/shared/services/formService";
import { PathUtils } from "@/shared/utils/pathUtils";
import { exists } from "@tauri-apps/plugin-fs";

export const createProjectForm = FormService.createForm({
    title: "Create new Project",
    okText: "Create",
    cancelText: "Cancel",
    inputs: [
        {
            id: "name",
            name: "name",
            type: "text",
            label: "Project Name",
            placeholder: "Your Tile Project",
            required: true,
        },
        {
            id: "destination",
            name: "destination",
            type: "folderPath",
            label: "Destination",
            placeholder: "Select a folder",
            required: true,
        }
    ],
    async validateBeforeSubmit(values) {
        const path = PathUtils.join(values.destination, values.name);
        const isExists = await exists(path);
        if (isExists) {
            return { valid: false, message: `Folder "${values.name}" already exists.` }
        }
        return { valid: true }
    },
})