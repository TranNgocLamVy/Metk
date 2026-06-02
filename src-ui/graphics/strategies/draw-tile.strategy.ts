import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { EditorFacade } from "@/application/editor.facade";
import { ITool } from "@/editor/interface/tool.interface";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tile } from "@/editor/model/tileset/tileset";
import { TilemapSession } from "@/editor/session/tilemap.session";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { Container, Sprite } from "pixi.js";
import { DrawPayload, IDrawStrategy } from "./draw-strategy.interface";


export class DrawTileStrategy implements IDrawStrategy {
    // TODO: Get this from config in the future
    public static readonly spriteAlpha = 0.9;

    public canHandle(layerRenderer: BaseLayerRenderer<any>, tool: ITool): boolean {
        return layerRenderer.layer instanceof TileLayer;
    }

    public getRefAt(pos: Position, layerRenderer: TileLayerRenderer): any {
        const coord = layerRenderer.posToCoord(pos);
        return layerRenderer.layer.getTileRefAt(coord);
    }

    public comparePosition(pos1: Position, pos2: Position, layerRenderer: TileLayerRenderer): boolean {
        if (!pos1 || !pos2 || !layerRenderer) return false;
        const coord1 = layerRenderer.posToCoord(pos1);
        const coord2 = layerRenderer.posToCoord(pos2);
        return coord1.col === coord2.col && coord1.row === coord2.row;
    }

    public getBrushSize(editorFacade: EditorFacade): { width: number, height: number } {
        const selectedTiles = this.getSelectedTiles(editorFacade);
        if (!selectedTiles) return { width: 1, height: 1 };
        const height = selectedTiles.length;
        const width = selectedTiles[0].length;
        return { width, height };
    }

    public drawHoverPreview(pos: Position, layerRenderer: TileLayerRenderer, editorFacade: EditorFacade, session: TilemapSession, overlayContainer: Container): Sprite[] {
        if (layerRenderer.layer.locked || !layerRenderer.layer.visible) return [];

        const selectedTiles = this.getSelectedTiles(editorFacade);
        if (!selectedTiles) return [];

        const coord = layerRenderer.posToCoord(pos); // TODO: Check again, very sus

        const sprites: Sprite[] = [];
        for (let r = 0; r < selectedTiles.length; r++) {
            const rowTiles = selectedTiles[r];
            for (let c = 0; c < rowTiles.length; c++) {
                const tile = rowTiles[c];
                if (!tile) continue;

                const col = coord.col + c;
                const row = coord.row + r;
                if (col < 0 || col >= session.tilemap.width || row < 0 || row >= session.tilemap.height) continue;

                const texture = editorFacade.textureManager.getTileTexture(tile.tileset.id, tile.id);
                if (!texture) continue;

                const sprite = new Sprite(texture);
                sprite.alpha = DrawTileStrategy.spriteAlpha;
                const drawPotision = layerRenderer.coordToPos({ col, row });
                const spriteHeight = texture.height;
                const tileHeight = layerRenderer.tilemap.tileHeight;
                sprite.position.set(drawPotision.x, drawPotision.y + (tileHeight - spriteHeight));
                overlayContainer.addChild(sprite);
                sprites.push(sprite);
            }
        }
        return sprites;
    }

    public getPayload(pos: Position, layerRenderer: TileLayerRenderer, editorFacade: EditorFacade, session: TilemapSession): DrawPayload[] {
        if (layerRenderer.layer.locked || !layerRenderer.layer.visible) return [];

        const selectedTiles = this.getSelectedTiles(editorFacade);
        if (!selectedTiles) return [];

        const coord = layerRenderer.posToCoord(pos);

        const data: DrawPayload[] = [];
        for (let r = 0; r < selectedTiles.length; r++) {
            const rowTiles = selectedTiles[r];
            for (let c = 0; c < rowTiles.length; c++) {
                const tile = rowTiles[c];
                if (!tile) continue;

                const col = coord.col + c;
                const row = coord.row + r;
                if (!session.tilemap.isInBoundary({ col, row })) continue;

                const texture = editorFacade.textureManager.getTileTexture(tile.tileset.id, tile.id);
                if (!texture) continue;

                const sprite = new Sprite(texture);
                sprite.alpha = DrawTileStrategy.spriteAlpha;
                const drawPotision = layerRenderer.coordToPos({ col, row });
                const spriteHeight = texture.height;
                const tileHeight = layerRenderer.tilemap.tileHeight;
                sprite.position.set(drawPotision.x, drawPotision.y + (tileHeight - spriteHeight));
                data.push({ key: `${col},${row}`, sprite, coordinate: { col, row }, position: drawPotision, tileId: tile.id, tilesetId: tile.tileset.id });
            }
        }
        return data;
    }

    public commit(layerRenderer: TileLayerRenderer, previewData: DrawPayload[], editorFacade: EditorFacade): void {
        if (layerRenderer.layer.locked || !layerRenderer.layer.visible) return;

        const historyManager = editorFacade.getCurrentHistoryManager();
        if (!historyManager) return;

        const updates = previewData.map((data) => {
            const { col, row } = data.coordinate;
            return { coordinate: { col, row }, tileId: data.tileId, tilesetId: data.tilesetId };
        });

        if (updates.length == 0) return;

        historyManager.startTransaction();
        historyManager.execute(new SetTilesCommand(layerRenderer.tilemap.objectId, layerRenderer.layer.objectId, updates), editorFacade);
        historyManager.commitTransaction();
    }

    // TODO: Cache this when selection changes in tileset session
    private getSelectedTiles(editorFacade: EditorFacade): (Tile | null)[][] | null {
        const session = editorFacade.getActiveTilesetSession();
        if (!session) return null;
        
        let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
        session.selectionState.selectedTilesSet.forEach((tileId) => {
            const { row, col } = session.tileset.getCoordinatesFromTile(tileId)!;
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
        })

        const rows: (Tile | null)[][] = [];
        for (let curRow = minRow; curRow <= maxRow; curRow++) {
            const colsArr: (Tile | null)[] = [];
            for (let curCol = minCol; curCol <= maxCol; curCol++) {
                const absRow = curRow;
                const absCol = curCol;
                const tile = session.tileset.getTileFromCoordinates(absRow, absCol);
                if (session.selectionState.selectedTilesSet.find((id) => tile && id === tile.id) === undefined) {
                    colsArr.push(null);
                } else {
                    colsArr.push(tile);
                }
            }
            rows.push(colsArr);
        }
        
        return rows;
    }
}
