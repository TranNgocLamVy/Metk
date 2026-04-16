import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";
import { IStamp, StampPreviewData } from "./IStamp";
import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { Color, Container, Sprite, Texture } from "pixi.js";
import { SetRuleRefsCommand } from "@/core/command/tile/setRulesCommand";


export class RuleStamp implements IStamp {
    public canHandle(layer: any): boolean {
        return layer instanceof RuleLayer;
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

    public stampAt(coord: Coordinate, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container, previewMap: Map<string, StampPreviewData>): void {
        const ruleset = editorContext.getSelectedRuleset();
        if (!ruleset) return;

        const { col: targetX, row: targetY } = coord;
        if (targetX < 0 || targetX >= session.tilemap.width || targetY < 0 || targetY >= session.tilemap.height) return;

        const key = `${targetX},${targetY}`;
        if (!previewMap.has(key)) {
            const sprite = new Sprite(Texture.WHITE);
            sprite.tint = new Color(ruleset.color);
            sprite.width = session.tilemap.tilewidth;
            sprite.height = session.tilemap.tileheight;
            sprite.position.set(targetX * session.tilemap.tilewidth, targetY * session.tilemap.tileheight);
            
            overlayContainer.addChild(sprite);
            previewMap.set(key, { sprite, rulesetId: ruleset.id });
        }
    }

    public commit(layer: any, previewMap: Map<string, StampPreviewData>, editorContext: EditorContext, historyManager: any): void {
        const updates = Array.from(previewMap.entries()).map(([key, data]) => {
            const [col, row] = key.split(',').map(Number);
            return { coordinate: { col, row }, rulesetId: data.rulesetId };
        });

        historyManager.execute(new SetRuleRefsCommand(layer.id, updates), editorContext);
    }
}