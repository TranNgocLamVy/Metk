import { BaseCommand, BaseExporter, BaseImporter, BaseTileMap } from "./models";

export interface IPluginRegistry {
    registerTileMap(tileMap: typeof BaseTileMap): void;
    registerCommand(command: typeof BaseCommand): void;
    registerImporter(importer: typeof BaseImporter): void;
    registerExporter(exporter: typeof BaseExporter): void;
}