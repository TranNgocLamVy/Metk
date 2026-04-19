import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";
import { IDrawStrategy, DrawPayload } from "./IDrawStrategy";
import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { Color, Container, Sprite, Texture } from "pixi.js";
import { SetRuleRefsCommand } from "@/core/command/tile/setRulesCommand";


export class DrawRuleStrategy implements IDrawStrategy {
    public canHandle(layer: any): boolean {
        return layer instanceof RuleLayer;
    }

    public getRefAt(coord: Coordinate, layer: RuleLayer): any {
        return layer.getRulesetRefAt(coord);
    }

    public getBrushSize(editorContext: EditorContext): { width: number, height: number } {
        return { width: 1, height: 1 };
    }

    public drawHoverPreview(coord: Coordinate, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[] {
        const selectedRuleset = editorContext.getSelectedRuleset();
        if (!selectedRuleset) return [];

        const { col, row } = coord;
        if (col < 0 || col >= session.tilemap.width || row < 0 || row >= session.tilemap.height) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.width = session.tilemap.tilewidth;
        sprite.height = session.tilemap.tileheight;
        sprite.position.set(col * session.tilemap.tilewidth, row * session.tilemap.tileheight);
        
        overlayContainer.addChild(sprite);
        return [sprite];
    }

    public getPayload(coord: Coordinate, editorContext: EditorContext, session: TilemapSession): DrawPayload[] {
        const selectedRuleset = editorContext.getSelectedRuleset();
        if (!selectedRuleset) return [];

        if (coord.col < 0 || coord.col >= session.tilemap.width || coord.row < 0 || coord.row >= session.tilemap.height) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.width = session.tilemap.tilewidth;
        sprite.height = session.tilemap.tileheight;
        
        return [{ sprite, coordinate: coord, rulesetId: selectedRuleset.id }];
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