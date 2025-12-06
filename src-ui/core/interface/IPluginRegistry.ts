import { BaseCommand } from "../model/baseCommand";

export interface IPluginRegistry {
    // registerTileMap(tileMap: typeof BaseTilemap): void;
    registerCommand(command: typeof BaseCommand): void;
}