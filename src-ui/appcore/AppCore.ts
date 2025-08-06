import EventEmitter from "eventemitter3";


export class AppCore extends EventEmitter {
    private static instance: AppCore;
    private constructor() {
        super();
    }
    public static initializeAppCore() {
        if (this.instance) {
            console.log("AppCore already initialized");
            return;
        }
        this.instance = new AppCore();
        this.instance.initializeEvent();
    }

    public static uninitializeAppCore() {
        if (!this.instance) {
            console.log("AppCore not initialized");
            return;
        }
        this.instance.uninitializeEvent();
    }

    public static Instance(): AppCore {
        return this.instance;
    }
    
    private initializeEvent() {

    }

    private uninitializeEvent() {

    }

}