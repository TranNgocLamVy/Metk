import { BaseCommand, BaseExporter, BaseImporter, BaseTileMap, IPluginRegistry } from "@/plugin-api";

import { CommandRegistry } from "./command-registry";
import { ExporterRegistry } from "./exporter-registry";
import { ImporterRegistry } from "./importer-registry";
import { TileMapRestry } from "./tilemap-registry";

export class PluginRegisty implements IPluginRegistry {

    registerTileMap(tileMap: typeof BaseTileMap): void {
        TileMapRestry.Instance().registerTileMap(tileMap.name, tileMap);
    }

    registerCommand(command: typeof BaseCommand): void {
        CommandRegistry.Instance().registerCommand(command.name, command);
    }

    registerImporter(importer: typeof BaseImporter): void {
        ImporterRegistry.Instance().registerImporter(importer.name, importer);
    }

    registerExporter(exporter: typeof BaseExporter): void {
        ExporterRegistry.Instance().registerExporter(exporter.name, exporter);
    }
}