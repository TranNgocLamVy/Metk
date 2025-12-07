import { DialogService } from "@/shared/services/dialogService";
import { Result } from "@/shared/types/result";

import { ITilemapStorageService } from "../../infrastructure/interface/ITilemapStorageService";
import { TilemapData } from "../../shared/schema/tilemapSchema";
import { Tilemap } from "../application/tilemap";
import { TilesetManager } from "./tilesetManager";

export class TilemapManager {
    private directory: string;

    private tilesetManager: TilesetManager;
    private tilemapStorageService: ITilemapStorageService;

    private tilemapPathMap: Map<string, string | null> = new Map<string, string | null>(); // filePath -> id
    private tilemapMap: Map<string, Tilemap | null> = new Map<string, Tilemap | null>(); // id -> tilemap

    public constructor(directory: string, tilesetManager: TilesetManager, tilemapStorageService: ITilemapStorageService) {
        this.directory = directory;
        this.tilesetManager = tilesetManager;
        this.tilemapStorageService = tilemapStorageService;
    }

    public getTilemapPaths(): string[] {
        return Array.from(this.tilemapMap.keys());
    }

    public loadTilemapPaths(filePath: string[]): void {
        filePath.forEach((path) => {
            this.tilemapPathMap.set(path, null);
        });
    }

    public async loadTilemap(filePath: string): Promise<Result<Tilemap | null>> {
        const tilemapId = this.tilemapPathMap.get(filePath);
        if (tilemapId == undefined) return { status: "Error", message: "Tilemap not found", data: null };

        const tilemap = await this.getTilemap(tilemapId);
        if (tilemap === null) return { status: "Error", message: "Tilemap not found", data: null };

        return { status: "Success", data: tilemap };
    }

    public async saveTilemap(id: string): Promise<Result> {
        const tilemap = this.tilemapMap.get(id);
        if (tilemap === null) return { status: "Error", message: "Tilemap not found" };
        // TODO: Save tilemap
        return { status: "Success", data: null };
    }

    public async getTilemap(id: string): Promise<Tilemap | null> {
        const tilemap = this.tilemapMap.get(id);
        if (tilemap === undefined) return null;
        if (tilemap === null) {
            // const loadedTilemap = await Tilemap.loadTilemap(id, { tilesetManager: this.tilesetManager });
            // this.tilemapMap.set(id, loadedTilemap);
            // return loadedTilemap;
        }
        return tilemap;
    }

    public async getTilemaps(): Promise<Tilemap[]> {
        const filePaths = Array.from(this.tilemapMap.keys());
        const tilemapPromises = filePaths.map(path => this.getTilemap(path));
        const results = await Promise.all(tilemapPromises);
        return results.filter((tm): tm is Tilemap => tm !== null);
    }

    public async createTilemap(): Promise<Result> {
        const form = await DialogService.openFormDialog({
            title: "Create new Tilemap",
            okText: "Create",
            cancelText: "Cancel",
            size: "md",
            inputs: [
                {
                    id: "name",
                    name: "name",
                    type: "text",
                    label: "Map Name",
                    placeholder: "Your Tile Map",
                    required: true,
                },
                {
                    id: "options",
                    name: "options",
                    type: "group",
                    label: "Map Options",
                    orientation: "horizontal",
                    visible: false,
                    inputs: [
                        {
                            id: "map",
                            name: "map",
                            type: "group",
                            label: "Map Size",
                            inputs: [
                                {
                                    id: "mapwidth",
                                    name: "mapwidth",
                                    type: "number",
                                    label: "Width",
                                    defaultValue: 64,
                                    required: true,
                                },
                                {
                                    id: "mapheight",
                                    name: "mapheight",
                                    type: "number",
                                    label: "Height",
                                    defaultValue: 64,
                                    required: true,
                                },
                                {
                                    id: "infinite",
                                    name: "infinite",
                                    type: "checkbox",
                                    label: "Infinite",
                                    required: false,
                                },
                            ]
                        },
                        {
                            id: "tile",
                            name: "tile",
                            type: "group",
                            label: "Tile Size",
                            inputs: [
                                {
                                    id: "tilewidth",
                                    name: "tilewidth",
                                    type: "number",
                                    label: "Width",
                                    defaultValue: 16,
                                    required: true,
                                },
                                {
                                    id: "tileheight",
                                    name: "tileheight",
                                    type: "number",
                                    label: "Height",
                                    defaultValue: 16,
                                    required: true,
                                },
                            ]
                        },
                    ]
                },
            ]
        })
        if (!form) return { status: "Cancel" };

        const tilemapData: TilemapData = {
            name: form.name,
            height: form.options.map.mapheight,
            width: form.options.map.mapwidth,
            tilewidth: form.options.tile.tilewidth,
            tileheight: form.options.tile.tileheight,
            infinite: form.options.map.infinite,
            tileset: [],
            layer: [],
        }

        const fullPath = this.directory + "\\" + form.name + ".tm.json";

        const newTilemap = new Tilemap(fullPath, tilemapData, { tilesetManager: this.tilesetManager })

        this.tilemapPathMap.set(fullPath, newTilemap.id);
        this.tilemapMap.set(newTilemap.id, newTilemap);

        return { status: "Success", data: null };
    }
}