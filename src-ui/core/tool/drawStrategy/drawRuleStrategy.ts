import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";
import { IDrawStrategy, DrawPayload } from "./IDrawStrategy";
import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { Color, Container, Sprite, Texture } from "pixi.js";
import { SetRuleRefsCommand } from "@/core/command/tile/setRulesCommand";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { ITool } from "@/core/interface/ITool";


export class DrawRuleStrategy implements IDrawStrategy {
    // TODO: Get this from config in the future
    public static readonly spriteAlpha = 0.9;

    public canHandle(layer: BaseLayer<any>, tool: ITool): boolean {
        return layer instanceof RuleLayer;
    }

    public getRefAt(pos: Position, layer: RuleLayer): any {
        const coord = layer.posToCoord(pos);
        return layer.getRulesetRefAt(coord);
    }

    public comparePosition(pos1: Position, pos2: Position, layer: RuleLayer): boolean {
        if (!pos1 || !pos2 || !layer) return false;
        const coord1 = layer.posToCoord(pos1);
        const coord2 = layer.posToCoord(pos2);
        return coord1.col === coord2.col && coord1.row === coord2.row;
    }

    public getBrushSize(editorContext: EditorContext): { width: number, height: number } {
        return { width: 1, height: 1 };
    }

    public drawHoverPreview(pos: Position, layer: RuleLayer, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[] {
        const selectedRuleset = editorContext.getSelectedRuleset();
        if (!selectedRuleset) return [];

        const coord = layer.posToCoord(pos); // TODO: Check again, very sus

        const { col, row } = coord;
        if (!session.tilemap.isInBoundary({ col, row })) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.alpha = DrawRuleStrategy.spriteAlpha;
        sprite.width = session.tilemap.tilewidth;
        sprite.height = session.tilemap.tileheight;
        const drawPotision = layer.coordToPos({ col, row });
        sprite.position.set(drawPotision.x, drawPotision.y);
        
        overlayContainer.addChild(sprite);
        return [sprite];
    }

    public getPayload(pos: Position, layer: RuleLayer, editorContext: EditorContext, session: TilemapSession): DrawPayload[] {
        const selectedRuleset = editorContext.getSelectedRuleset();
        if (!selectedRuleset) return [];

        const coord = layer.posToCoord(pos);

        if (coord.col < 0 || coord.col >= session.tilemap.width || coord.row < 0 || coord.row >= session.tilemap.height) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.alpha = DrawRuleStrategy.spriteAlpha;
        sprite.width = session.tilemap.tilewidth;
        sprite.height = session.tilemap.tileheight;
        const drawPotision = layer.coordToPos({ col: coord.col, row: coord.row });
        sprite.position.set(drawPotision.x, drawPotision.y);
        
        return [{ key: `${coord.col},${coord.row}`, sprite, coordinate: coord, position: drawPotision, rulesetId: selectedRuleset.id }];
    }

    public commit(layer: RuleLayer, previewData: DrawPayload[], editorContext: EditorContext): void {
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!historyManager) return;

        const updates = previewData.map((data) => {
            const { col, row } = data.coordinate;
            return { coordinate: { col, row }, rulesetId: data.rulesetId };
        });

        if (updates.length == 0) return;

        historyManager.startTransaction();
        historyManager.execute(new SetRuleRefsCommand(layer.id, updates), editorContext);
        historyManager.commitTransaction();
    }
}