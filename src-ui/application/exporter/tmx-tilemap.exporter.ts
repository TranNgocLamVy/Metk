import { create } from "xmlbuilder2";

import { ITilemapExporter } from "@/editor/interface/tilemap-exporter.interface";
import { PathUtils } from "@/shared/utils/path.utils";

import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { BaseLayer } from "@/editor/model/tilemap/layer/base-layer";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { ImageCollectionTileset } from "@/editor/model/tileset/image-collection-tileset";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { CollisionObjectData } from "@/shared/data-types/collision-object.data";
import { EntityFieldData } from "@/shared/data-types/entity.data";
import { EntityInstanceData } from "@/shared/data-types/layer.data";
import { EditorFacade } from "../editor.facade";

type XMLBuilder = ReturnType<typeof create>;
type XmlObject = Record<string, unknown>;

export class TmxTilemapExporter implements ITilemapExporter {
    private tilesetFirstGidMap: Map<number, number> = new Map<number, number>(); // tileset ref index -> firstgid
    private exportPath: string;
    private nextLayerId: number = 1;
    private nextMapObjectId: number = 1;
    private nextTilesetObjectId: number = 1;

    public export(tilemap: Tilemap, exportPath: string, editorFacade: EditorFacade): Uint8Array {
        this.tilesetFirstGidMap.clear();
        this.exportPath = exportPath;
        this.nextLayerId = 1;
        this.nextMapObjectId = 1;
        this.nextTilesetObjectId = 1;

        this.ensureEntityGraphicTilesetRefs(tilemap.rootLayer.layers, tilemap);

        const tilesets = this.getTilesets(tilemap, exportPath, editorFacade);
        const layers = this.getLayers(tilemap.rootLayer.layers, 0, tilemap);

        const builder: XMLBuilder = create({ version: "1.0", encoding: "UTF-8" });

        const map = builder.ele("map", {
            version: "1.10",
            tiledversion: "1.10.2",
            orientation: "orthogonal",
            renderorder: "right-down",
            width: tilemap.width,
            height: tilemap.height,
            tileWidth: tilemap.tileWidth,
            tileHeight: tilemap.tileHeight,
            nextlayerid: this.nextLayerId,
            nextobjectid: this.nextMapObjectId,
        });

        tilesets.forEach((tileset) => map.import(tileset.root()));
        layers.forEach((layer) => map.import(layer.root()));

        const xml = builder.end({ prettyPrint: true });
        return new TextEncoder().encode(xml);
    }

    private getTilesets(
        tilemap: Tilemap,
        exportPath: string,
        _editorFacade: EditorFacade,
    ): XMLBuilder[] {
        const tilesetRefManager = tilemap.tilesetRefManager;
        const tilesetManager = tilesetRefManager.tilesetManager;

        let firstGidCount = 1;

        const tilesets = tilesetRefManager
            .serialize()
            .refs
            .sort((a, b) => a.index - b.index)
            .map((tilesetRef) => {
                const tileset = tilesetManager.getTilesetById(tilesetRef.id);
                if (!tileset) return null;

                const firstGid = firstGidCount;
                const tilesetIndex = tilesetRefManager.getTilesetRefIndex(tilesetRef.id);

                this.tilesetFirstGidMap.set(tilesetIndex, firstGid);
                firstGidCount += this.getTilesetGidSpan(tileset);

                if (tileset instanceof SingleImageTileset) {
                    return this.getSingleImageTileset(tileset, exportPath, firstGid);
                }

                if (tileset instanceof ImageCollectionTileset) {
                    return this.getImageCollectionTileset(tileset, exportPath, firstGid);
                }

                return null;
            })
            .filter((tileset): tileset is XMLBuilder => tileset != null);

        return tilesets;
    }

    private getTilesetGidSpan(tileset: Tileset): number {
        if (tileset.tiles.length === 0) return 0;

        const maxTileId = Math.max(...tileset.tiles.map((tile) => tile.id));

        return Math.max(tileset.tiles.length, maxTileId + 1);
    }

    private getSingleImageTileset(
        tileset: SingleImageTileset,
        exportPath: string,
        firstGid: number,
    ): XMLBuilder | null {
        const tilesetAbsPath = tileset.tilesetPathSystem.getFileAbsPath();
        const tilesetAbsDir = PathUtils.dirname(tilesetAbsPath);

        const imageRelPath = tileset.imageSource.source;
        const imageAbsPath = PathUtils.join(tilesetAbsDir, imageRelPath);
        const source = PathUtils.relative(PathUtils.dirname(exportPath), imageAbsPath);

        const tiles = tileset.tiles
            .map((tile) =>
                this.getTilesetTile(tile, tileset, exportPath, {
                    includeImage: false,
                    skipEmptyTile: true,
                }),
            )
            .filter((tile): tile is XmlObject => tile !== null);

        return create({
            tileset: {
                "@firstgid": firstGid,
                "@name": tileset.name,
                "@tileWidth": tileset.tileWidth,
                "@tileHeight": tileset.tileHeight,
                "@tilecount": tileset.tiles.length,
                "@columns": tileset.columns,
                image: {
                    "@source": source,
                    "@width": tileset.imageSource.width,
                    "@height": tileset.imageSource.height,
                },
                ...(tiles.length > 0 ? { tile: tiles } : {}),
            },
        });
    }

    private getImageCollectionTileset(
        tileset: ImageCollectionTileset,
        exportPath: string,
        firstGid: number,
    ): XMLBuilder | null {
        const tiles = tileset.tiles
            .map((tile) =>
                this.getTilesetTile(tile, tileset, exportPath, {
                    includeImage: true,
                    skipEmptyTile: false,
                }),
            )
            .filter((tile): tile is XmlObject => tile !== null);

        return create({
            tileset: {
                "@firstgid": firstGid,
                "@name": tileset.name,
                "@tileWidth": tileset.tileWidth,
                "@tileHeight": tileset.tileHeight,
                "@tilecount": tileset.tiles.length,
                "@columns": tileset.columns,
                ...(tiles.length > 0 ? { tile: tiles } : {}),
            },
        });
    }

    private getTilesetTile(
        tile: Tile,
        tileset: Tileset,
        exportPath: string,
        options: {
            includeImage: boolean;
            skipEmptyTile: boolean;
        },
    ): XmlObject | null {
        const tileData: XmlObject = {
            "@id": tile.id,
        };

        if (options.includeImage && tile.imageSource) {
            const image = this.getTileImage(tile, tileset, exportPath);
            if (image) {
                tileData.image = image;
            }
        }

        const objectgroup = this.getTileObjectGroup(tile);
        if (objectgroup) {
            tileData.objectgroup = objectgroup;
        }

        const hasTileContent = Boolean(tileData.image || tileData.objectgroup);
        if (options.skipEmptyTile && !hasTileContent) return null;

        return tileData;
    }

    private getTileImage(tile: Tile, tileset: Tileset, exportPath: string): XmlObject | null {
        if (!tile.imageSource) return null;

        const tilesetAbsPath = tileset.tilesetPathSystem.getFileAbsPath();
        const tilesetAbsDir = PathUtils.dirname(tilesetAbsPath);
        const imageAbsPath = PathUtils.join(tilesetAbsDir, tile.imageSource.source);
        const source = PathUtils.relative(PathUtils.dirname(exportPath), imageAbsPath);

        return {
            "@source": source,
            "@width": tile.imageSource.width,
            "@height": tile.imageSource.height,
        };
    }

    private getTileObjectGroup(tile: Tile): XmlObject | null {
        if (tile.collisionObjects.length === 0) return null;

        const objects = tile.collisionObjects.map((collisionObject) =>
            this.getCollisionObject(collisionObject.serialize()),
        );

        return {
            "@draworder": "index",
            object: objects,
        };
    }

    private getCollisionObject(collisionObject: CollisionObjectData): XmlObject {
        const object: XmlObject = {
            "@id": this.nextTilesetObjectId++,
            "@name": collisionObject.name ?? "",
            "@type": collisionObject.kind,
            "@x": collisionObject.x,
            "@y": collisionObject.y,
            "@visible": collisionObject.visible === false ? 0 : 1,
            properties: {
                property: [
                    this.createProperty("metk.collisionId", collisionObject.id),
                    this.createProperty("metk.collisionKind", collisionObject.kind),
                    this.createProperty("metk.locked", collisionObject.locked ?? false, "bool"),
                ],
            },
        };

        switch (collisionObject.kind) {
            case "box":
                object["@width"] = collisionObject.width;
                object["@height"] = collisionObject.height;
                break;

            case "point":
                object.point = {};
                break;

            case "polygon":
                object.polygon = {
                    "@points": collisionObject.points
                        .map((point) => `${point.x},${point.y}`)
                        .join(" "),
                };
                break;
        }

        return object;
    }

    private getLayers(
        layers: BaseLayer<any>[],
        baseIndex: number,
        tilemap: Tilemap,
    ): XMLBuilder[] {
        let index = baseIndex;

        return layers
            .map((childLayer) => {
                let layer: XMLBuilder | null = null;

                if (childLayer instanceof TileLayer) {
                    layer = this.getTileLayer(childLayer, index, tilemap);
                    index++;
                } else if (childLayer instanceof GroupLayer) {
                    layer = this.getGroupLayer(childLayer, index, tilemap);
                    index++;
                } else if (childLayer instanceof RuleLayer) {
                    layer = this.getRuleLayer(childLayer, index, tilemap);
                    index++;
                } else if (childLayer instanceof ImageLayer) {
                    layer = this.getImageLayer(childLayer, index, tilemap);
                    index++;
                } else if (childLayer instanceof EntityLayer) {
                    layer = this.getEntityLayer(childLayer, index, tilemap);
                    index++;
                }

                return layer;
            })
            .filter((layer): layer is XMLBuilder => layer != null)
            .reverse();
    }

    private getGroupLayer(
        groupLayer: GroupLayer,
        index: number,
        tilemap: Tilemap,
    ): XMLBuilder {
        const childLayers = this.getLayers(groupLayer.layers, index + 1, tilemap);

        const layer = create({
            group: {
                "@id": this.getNextLayerId(),
                "@name": groupLayer.name,
                "@opacity": groupLayer.opacity,
                "@visible": groupLayer.visible ? 1 : 0,
                "@locked": groupLayer.locked ? 1 : 0,
                properties: {
                    property: [this.createProperty("metk.layerId", groupLayer.id)],
                },
            },
        });

        childLayers.forEach((childLayer) => layer.root().import(childLayer.root()));

        return layer;
    }

    private getTileLayer(
        tileLayer: TileLayer,
        _index: number,
        _tilemap: Tilemap,
    ): XMLBuilder {
        return create({
            layer: {
                "@id": this.getNextLayerId(),
                "@name": tileLayer.name,
                "@width": tileLayer.size.width,
                "@height": tileLayer.size.height,
                "@x": tileLayer.coordinate.col,
                "@y": tileLayer.coordinate.row,
                "@opacity": tileLayer.opacity,
                "@visible": tileLayer.visible ? 1 : 0,
                "@locked": tileLayer.locked ? 1 : 0,
                properties: {
                    property: [this.createProperty("metk.layerId", tileLayer.id)],
                },
                data: {
                    "@encoding": "csv",
                    "#text": tileLayer.tilesRef
                        .map((row) =>
                            row.map((tileRef) => {
                                if (!tileRef) return 0;
                                return this.getTileGidFromRefIndex(
                                    tileRef.tilesetIndex,
                                    tileRef.tileId,
                                );
                            }),
                        )
                        .flat()
                        .join(","),
                },
            },
        });
    }

    private getRuleLayer(
        ruleLayer: RuleLayer,
        _index: number,
        _tilemap: Tilemap,
    ): XMLBuilder {
        ruleLayer.reCalculateAllOutputs();

        return create({
            layer: {
                "@id": this.getNextLayerId(),
                "@name": ruleLayer.name,
                "@width": ruleLayer.size.width,
                "@height": ruleLayer.size.height,
                "@x": ruleLayer.coordinate.col,
                "@y": ruleLayer.coordinate.row,
                "@opacity": ruleLayer.opacity,
                "@visible": ruleLayer.visible ? 1 : 0,
                "@locked": ruleLayer.locked ? 1 : 0,
                properties: {
                    property: [this.createProperty("metk.layerId", ruleLayer.id)],
                },
                data: {
                    "@encoding": "csv",
                    "#text": ruleLayer.rulesetsRef
                        .map((row) =>
                            row.map((rulesetRef) => {
                                if (
                                    !rulesetRef ||
                                    rulesetRef.tileId === -1 ||
                                    rulesetRef.tilesetIndex === -1
                                ) {
                                    return 0;
                                }

                                return this.getTileGidFromRefIndex(
                                    rulesetRef.tilesetIndex,
                                    rulesetRef.tileId,
                                );
                            }),
                        )
                        .flat()
                        .join(","),
                },
            },
        });
    }

    private getImageLayer(
        imageLayer: ImageLayer,
        _index: number,
        tilemap: Tilemap,
    ): XMLBuilder {
        const imageAbsPath = tilemap.tilemapPathSystem.getAbsPathFromRelPath(
            imageLayer.imageSource.source,
        );
        const source = PathUtils.relative(PathUtils.dirname(this.exportPath), imageAbsPath);

        return create({
            imagelayer: {
                "@id": this.getNextLayerId(),
                "@name": imageLayer.name,
                "@offsetx": imageLayer.offset.x,
                "@offsety": imageLayer.offset.y,
                "@parallaxx": imageLayer.parallax.x,
                "@parallaxy": imageLayer.parallax.y,
                "@opacity": imageLayer.opacity,
                "@visible": imageLayer.visible ? 1 : 0,
                "@locked": imageLayer.locked ? 1 : 0,
                ...(imageLayer.tintcolor ? { "@tintcolor": imageLayer.tintcolor } : {}),
                "@repeatx": imageLayer.repeatX ? 1 : 0,
                "@repeaty": imageLayer.repeatY ? 1 : 0,
                properties: {
                    property: [this.createProperty("metk.layerId", imageLayer.id)],
                },
                image: {
                    "@source": source,
                    "@width": imageLayer.imageSource.width,
                    "@height": imageLayer.imageSource.height,
                },
            },
        });
    }

    private getEntityLayer(
        entityLayer: EntityLayer,
        _index: number,
        tilemap: Tilemap,
    ): XMLBuilder {
        const objects = entityLayer
            .getAllEntityData()
            .map((entity) => this.getEntityObject(entityLayer, entity, tilemap))
            .filter((entity): entity is XmlObject => entity !== null);

        return create({
            objectgroup: {
                "@id": this.getNextLayerId(),
                "@name": entityLayer.name,
                "@offsetx": entityLayer.offset.x,
                "@offsety": entityLayer.offset.y,
                "@opacity": entityLayer.opacity,
                "@visible": entityLayer.visible ? 1 : 0,
                "@locked": entityLayer.locked ? 1 : 0,
                "@draworder": "index",
                properties: {
                    property: [this.createProperty("metk.layerId", entityLayer.id)],
                },
                ...(objects.length > 0 ? { object: objects } : {}),
            },
        });
    }

    private getEntityObject(
        entityLayer: EntityLayer,
        entity: EntityInstanceData,
        tilemap: Tilemap,
    ): XmlObject | null {
        const definition = entityLayer.getEntityDefinition(entity);
        if (!definition) return null;

        const x = entity.x - definition.pivotX;
        const y = entity.y - definition.pivotY;

        const object: XmlObject = {
            "@id": this.nextMapObjectId++,
            "@name": definition.name,
            "@type": definition.id,
            "@x": x,
            "@y": y,
            "@width": definition.width,
            "@height": definition.height,
        };

        if (definition.graphic.type === "tile") {
            const gid = this.getTileGidByTilesetId(
                tilemap,
                definition.graphic.tilesetId,
                definition.graphic.tileId,
            );

            if (gid !== null) {
                object["@gid"] = gid;

                // Tiled aligns orthogonal tile objects to bottom-left.
                object["@y"] = y + definition.height;
            }
        }

        const properties = this.getEntityObjectProperties(entity, definition);

        if (properties.length > 0) {
            object.properties = {
                property: properties,
            };
        }

        return object;
    }

    private getEntityObjectProperties(
        entity: EntityInstanceData,
        definition: EntityDefinition,
    ): XmlObject[] {
        const properties: XmlObject[] = [
            this.createProperty("metk.entityId", entity.id),
            this.createProperty("metk.entityCollectionId", entity.entityRef.entityCollectionId),
            this.createProperty("metk.entityDefinitionId", entity.entityRef.entityDefinitionId),
        ];

        definition.fields.forEach((field) => {
            const hasInstanceValue =
                entity.fields &&
                Object.prototype.hasOwnProperty.call(entity.fields, field.id);

            const value = hasInstanceValue ? entity.fields?.[field.id] : field.value;

            properties.push(
                this.createProperty(
                    field.name ?? field.id,
                    value,
                    this.getTiledPropertyType(field),
                ),
            );
        });

        return properties;
    }

    private createProperty(name: string, value: unknown, type?: string): XmlObject {
        const property: XmlObject = {
            "@name": name,
        };

        if (type) {
            property["@type"] = type;
        }

        const formattedValue = this.formatTiledPropertyValue(value, type);

        if (typeof formattedValue === "string" && formattedValue.includes("\n")) {
            property["#text"] = formattedValue;
        } else {
            property["@value"] = formattedValue;
        }

        return property;
    }

    private getTiledPropertyType(field: EntityFieldData): string | undefined {
        switch (field.type) {
            case "int":
            case "float":
            case "bool":
            case "color":
                return field.type;
            default:
                return undefined;
        }
    }

    private formatTiledPropertyValue(value: unknown, type?: string): string | number {
        if (type === "bool") {
            return value === true || value === "true" ? "true" : "false";
        }

        if (type === "int") {
            return Math.trunc(Number(value ?? 0));
        }

        if (type === "float") {
            return Number(value ?? 0);
        }

        if (value == null) return "";

        if (typeof value === "object") {
            try {
                return JSON.stringify(value) ?? "";
            } catch {
                return String(value);
            }
        }

        return String(value);
    }

    private getTileGidFromRefIndex(tilesetIndex: number, tileId: number): number {
        const tilesetFirstGid = this.tilesetFirstGidMap.get(tilesetIndex);
        if (tilesetFirstGid === undefined) return 0;

        return tileId + tilesetFirstGid;
    }

    private getTileGidByTilesetId(
        tilemap: Tilemap,
        tilesetId: string,
        tileId: number,
    ): number | null {
        const tilesetIndex = tilemap.tilesetRefManager.getTilesetRefIndex(tilesetId);
        if (tilesetIndex === -1) return null;

        const gid = this.getTileGidFromRefIndex(tilesetIndex, tileId);
        return gid === 0 ? null : gid;
    }

    private ensureEntityGraphicTilesetRefs(
        layers: BaseLayer<any>[],
        tilemap: Tilemap,
    ): void {
        layers.forEach((layer) => {
            if (layer instanceof GroupLayer) {
                this.ensureEntityGraphicTilesetRefs(layer.layers, tilemap);
                return;
            }

            if (!(layer instanceof EntityLayer)) return;

            layer.getAllEntityData().forEach((entity) => {
                const definition = layer.getEntityDefinition(entity);

                if (definition?.graphic.type !== "tile") return;

                tilemap.tilesetRefManager.getTilesetRefIndex(definition.graphic.tilesetId);
            });
        });
    }

    private getNextLayerId(): number {
        return this.nextLayerId++;
    }
}
