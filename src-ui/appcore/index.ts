import EventEmitter from "eventemitter3";

import { ProjectManager } from "./managers/ProjectManager";
import { PluginRegistry } from "./registries/plugin-registry";

export class Appcore extends EventEmitter {
    private static instance: Appcore;
    public readonly projectManager: ProjectManager;
    public readonly pluginRegistry: PluginRegistry;
    private constructor() {
        super();
        this.projectManager = new ProjectManager();
    }
    public static initializeAppcore() {
        if (this.instance) {
            console.log("Appcore already initialized");
            return;
        }
        this.instance = new Appcore();
        this.instance.initializeEvent();
    }

    public static uninitializeAppcore() {
        if (!this.instance) {
            console.log("Appcore not initialized");
            return;
        }
        this.instance.uninitializeEvent();
    }

    public static getInstance(): Appcore {
        return this.instance;
    }
    
    private initializeEvent() {

    }

    private uninitializeEvent() {

    }

}