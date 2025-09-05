import { v4 as uuidv4 } from "uuid";

import { EventBus } from "@/appcore/models/core/EventBus";

import { CommandManager } from "../command/CommandManager";
import { Project } from "../project/Project";

export class ProjectSession {
    public readonly id: string;
    private readonly eventBus: EventBus; 
    private readonly commandManager: CommandManager;
    private project: Project;

    constructor(project: Project) {
        this.id = uuidv4();
        this.eventBus = new EventBus();
        this.commandManager = new CommandManager(this.eventBus);
        this.project = project;
    }

    public serialize(): any {
        // TODO: Serialize project session
    }
}