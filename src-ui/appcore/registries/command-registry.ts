import { Appcore } from "../core";
import { BaseCommand } from "../models/command/Command";

export class CommandRegistry {
    private commands: Map<string, typeof BaseCommand>;

    public static getInstance(): CommandRegistry {
        return Appcore.getInstance().pluginRegistry.commandRegistry;
    }

    public constructor() {
        this.commands = new Map();
    }

    public registerCommand(name: string, command: typeof BaseCommand): void {
        this.commands.set(name, command);
    }

    public getCommand(name: string): typeof BaseCommand | undefined {
        return this.commands.get(name);
    }
        
}