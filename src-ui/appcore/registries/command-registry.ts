import { BaseCommand } from "@/plugin-api/models";

export class CommandRegistry {
    private static instance: CommandRegistry;
    private commands: Map<string, typeof BaseCommand>;

    private constructor() {
        this.commands = new Map();
    }

    public static Instance(): CommandRegistry {
        if (!this.instance) {
            this.instance = new CommandRegistry();
        }
        return this.instance;
    }

    public registerCommand(name: string, command: typeof BaseCommand): void {
        this.commands.set(name, command);
    }

    public getCommand(name: string): typeof BaseCommand | undefined {
        return this.commands.get(name);
    }
        
}