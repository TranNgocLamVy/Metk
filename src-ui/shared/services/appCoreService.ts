import { AppCore } from "@/core/appcore";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

export class AppCoreService {
    public static async load() {
        const loadResult = await AppCore.getIns().load();
        if (loadResult.status == "Success") {
            useProjectManagerStore.getState().setProjects(AppCore.getIns().projectManager.projectMetaData);
        }
    }
}