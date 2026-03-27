import { create } from "xmlbuilder2";

import { ITilemapExporter } from "@/core/interface/ITilemapExporter";
import { PathUtils } from "@/shared/utils/pathUtils";

import { EditorContext } from "../editorContext";
import { BaseLayer } from "../tile/layer/baseLayer";
import { GroupLayer } from "../tile/layer/groupLayer";
import { TileLayer, TileRef } from "../tile/layer/tileLayer";
import { Tilemap } from "../tile/tilemap";

type XMLBuilder = ReturnType<typeof create>;

export class TmxTilemapExporter implements ITilemapExporter {
    private tilesetFirstGidMap: Map<number, number> = new Map<number, number>(); // id -> firstGid

    public export(tilemap: Tilemap, exportPath: string, editorContext: EditorContext): Uint8Array {

        const builder: XMLBuilder = create({ version: '1.0', encoding: 'UTF-8' })

        const map = builder.ele('map', {
            version: '1.10',
            tiledversion: '1.10.2',
            orientation: 'orthogonal',
            renderorder: 'right-down',
            width: tilemap.width,
            height: tilemap.height,
            tilewidth: tilemap.tilewidth,
            tileheight: tilemap.tileheight,
        });

        this.getTilesets(tilemap, exportPath, editorContext).forEach((tileset) => map.import(tileset.root()));

        const layers = this.getLayers(tilemap.rootLayer.layers, 0, tilemap);

        layers.forEach((layer) => map.import(layer.root()));

        const xml = builder.end({ prettyPrint: true });
        return new TextEncoder().encode(xml);
    }

    private getTilesets(tilemap: Tilemap, exportPath: string, editorContext: EditorContext): XMLBuilder[] {
        const tilesetRefManager = tilemap.tilesetRefManager;
        const tilesetManager = tilesetRefManager.tilesetManager;

        let firstGidCount = 1;
        const tilesets = tilesetRefManager.tilesetRef.sort((a, b) => a.index - b.index).map((tilesetRef) => {
            const tileset = tilesetManager.getTilesetById(tilesetRef.id)!;

            const firstGrid = firstGidCount;
            const tilesetIndex = tilesetRefManager.getTilesetIndexById(tilesetRef.id);
            this.tilesetFirstGidMap.set(tilesetIndex, firstGrid);
            firstGidCount += tileset.tiles.length;

            const tilesetAbsPath = tilesetManager.getTilesetAbsById(tilesetRef.id)!;
            const tilesetAbsDir = PathUtils.dirname(tilesetAbsPath);

            const imageRelPath = tileset.image.source;
            const imageAbsPath = PathUtils.join(tilesetAbsDir, imageRelPath);

            const source = PathUtils.relative(PathUtils.dirname(exportPath), imageAbsPath);

            const name = tileset.name;

            const tileWidth = tileset.tilewidth;
            const tileHeight = tileset.tileheight;

            const tileCount = tileset.tiles.length;
            const columns = tileset.columns;

            return create({
                tileset: {
                    '@firstgid': firstGrid,
                    '@name': name,
                    '@tilewidth': tileWidth,
                    '@tileheight': tileHeight,
                    '@tilecount': tileCount,
                    '@columns': columns,
                    image: {
                        '@source': source,
                        '@width': tileset.image.width,
                        '@height': tileset.image.height
                    }
                }
            })
        })
        return tilesets;
    }

    private getLayers(layers: BaseLayer<any>[], baseIndex: number, tilemap: Tilemap): XMLBuilder[] {
        let index = baseIndex;
        return layers.map((childLayer) => {
            let layer: XMLBuilder | null = null;
            if (childLayer instanceof TileLayer) {
                layer = this.getTileLayer(childLayer, index, tilemap);
                index++;
            } else if (childLayer instanceof GroupLayer) {
                layer = this.getGroupLayer(childLayer, index, tilemap);
                index++;
            }
            return layer;
        }).filter((layer) => layer != null).reverse();
    }

    private getGroupLayer(groupLayer: GroupLayer, index: number, tilemap: Tilemap): XMLBuilder {
        const childLayers = this.getLayers(groupLayer.layers, index + 1, tilemap);
        const layer = create({
            group: {
                '@id': groupLayer.id,
                '@name': groupLayer.name
            }
        })
        childLayers.forEach((childLayer) => layer.import(childLayer.root()));
        return layer;
    }

    private getTileLayer(tileLayer: TileLayer, index: number, tilemap: Tilemap): XMLBuilder {
        const layer = create({
            layer: {
                '@id': tileLayer.id,
                '@name': tileLayer.name,
                '@width': tileLayer.size.width,
                '@height': tileLayer.size.height,
                '@x': tileLayer.coordinate.col,
                '@y': tileLayer.coordinate.row,
                '@opacity': tileLayer.opacity,
                // '@visible': tileLayer.visible,
                // '@locked': tileLayer.locked,
                data: {
                    '@encoding': 'csv',
                    '#text': tileLayer.tilesRef.map((row) => row.map((tileRef) => {
                        if (!tileRef) return 0;
                        const tilesetFirstGid = this.tilesetFirstGidMap.get(tileRef.getTile().tilesetIndex)!;
                        if (tilesetFirstGid == undefined) return 0;
                        return tileRef.getTile().tileId + tilesetFirstGid
                    })).flat().join(',')
                }
            }
        })
        return layer;
    }
}