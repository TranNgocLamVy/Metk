import EventEmitter from "eventemitter3";

import { JsonProjectRepository } from "@/infrastructure/ProjectRepository";
import { JsonProjectStorageService } from "@/infrastructure/ProjectStorageService";
import { useAppcore } from "@/view/stores/appCoreStore";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

import { ProjectManager } from "./application/projectManager";

const PROJECT_REPO_FILE_NAME = "projects.json";

export class Appcore extends EventEmitter {
    private static instance: Appcore;
    public readonly projectManager: ProjectManager;

    private constructor() {
        super();
        const projectRepo = new JsonProjectRepository(PROJECT_REPO_FILE_NAME, BaseDirectory.AppData);
        const projectStorageService = new JsonProjectStorageService(BaseDirectory.AppData);
        this.projectManager = new ProjectManager(projectRepo, projectStorageService);
        this.load();
    }

    private async load() {
        await this.projectManager.load();
        useAppcore.getState().setIsLoading(false);
    }

    public static initializeAppcore() {
        if (this.instance) {
            console.log("Appcore already initialized");
            return;
        }
        this.instance = new Appcore();
    }

    public static getInstance(): Appcore {
        return this.instance;
    }
}