import { BaseCommand, BaseExporter, BaseImporter, BaseTilemap, IPluginRegistry } from "@/plugin-api";

import { CommandRegistry } from "./command-registry";
import { ExporterRegistry } from "./exporter-registry";
import { ImporterRegistry } from "./importer-registry";
import { TileMapRestry } from "./tilemap-registry";

export class PluginRegistry implements IPluginRegistry {
    private readonly tileMapRegistry: TileMapRestry;
    private readonly commandRegistry: CommandRegistry;
    private readonly importerRegistry: ImporterRegistry;
    private readonly exporterRegistry: ExporterRegistry;

    public constructor() {
        this.tileMapRegistry = new TileMapRestry();
        this.commandRegistry = new CommandRegistry();
        this.importerRegistry = new ImporterRegistry(); 
        this.exporterRegistry = new ExporterRegistry();
    }

    registerTileMap(tileMap: typeof BaseTilemap): void {
        this.tileMapRegistry.registerTileMap(tileMap.name, tileMap);
    }

    registerCommand(command: typeof BaseCommand): void {
        this.commandRegistry.registerCommand(command.name, command);
    }

    registerImporter(importer: typeof BaseImporter): void {
        this.importerRegistry.registerImporter(importer.name, importer);
    }

    registerExporter(exporter: typeof BaseExporter): void {
        this.exporterRegistry.registerExporter(exporter.name, exporter);
    }
}