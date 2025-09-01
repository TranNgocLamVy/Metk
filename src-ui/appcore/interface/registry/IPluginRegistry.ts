import { BaseTilemap } from "@/appcore/models/tile/Tilemap";

import { BaseCommand } from "../../models/command/Command";

export interface IPluginRegistry {
    registerTileMap(tileMap: typeof BaseTilemap): void;
    registerCommand(command: typeof BaseCommand): void;
}