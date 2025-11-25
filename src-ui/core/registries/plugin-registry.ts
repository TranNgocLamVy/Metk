
// import { IPluginRegistry } from "../interface/registry/IPluginRegistry";
// import { BaseCommand } from "../models/command/Command";
// import { CommandRegistry } from "./command-registry";
// import { TileMapRestry } from "./tilemap-registry";

// export class PluginRegistry implements IPluginRegistry {
//     public readonly tileMapRegistry: TileMapRestry;
//     public readonly commandRegistry: CommandRegistry;

//     public constructor() {
//         this.tileMapRegistry = new TileMapRestry();
//         this.commandRegistry = new CommandRegistry();
//     }

//     registerTileMap(tileMap: typeof BaseTilemap): void {
//         this.tileMapRegistry.registerTileMap(tileMap.name, tileMap);
//     }

//     registerCommand(command: typeof BaseCommand): void {
//         this.commandRegistry.registerCommand(command.name, command);
//     }
// }