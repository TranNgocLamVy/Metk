import { BaseCommand } from "./models/command";
import { BaseExporter } from "./models/exporter";
import { BaseImporter } from "./models/importer";
import { BaseTilemap } from "./models/tilemap/tilemap";

export interface IPluginRegistry {
    registerTileMap(tileMap: typeof BaseTilemap): void;
    registerCommand(command: typeof BaseCommand): void;
    registerImporter(importer: typeof BaseImporter): void;
    registerExporter(exporter: typeof BaseExporter): void;
}