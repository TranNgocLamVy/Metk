import { IDrawStrategy, DrawPayload } from "./IDrawStrategy";
import { EditorContext } from "@/editor/application/editorContext";
import { TilemapSession } from "@/editor/application/session/tilemapSession";
import { Color, Container, Sprite, Texture } from "pixi.js";
import { SetRuleRefsCommand } from "@/editor/command/tile/setRulesCommand";
import { ITool } from "@/editor/interface/ITool";
import { BaseLayerRenderer } from "@/graphics/renderer/baseLayerRenderer";
import { RuleLayerRenderer } from "@/graphics/renderer/ruleLayerRenderer";


export class DrawRuleStrategy implements IDrawStrategy {
    // TODO: Get this from config in the future
    public static readonly spriteAlpha = 0.9;

    public canHandle(layerRenderer: BaseLayerRenderer<any>, tool: ITool): boolean {
        return layerRenderer.layer instanceof RuleLayerRenderer;
    }

    public getRefAt(pos: Position, layerRenderer: RuleLayerRenderer): any {
        const coord = layerRenderer.posToCoord(pos);
        return layerRenderer.layer.getRulesetRefAt(coord);
    }

    public comparePosition(pos1: Position, pos2: Position, layerRenderer: RuleLayerRenderer): boolean {
        if (!pos1 || !pos2 || !layerRenderer) return false;
        const coord1 = layerRenderer.posToCoord(pos1);
        const coord2 = layerRenderer.posToCoord(pos2);
        return coord1.col === coord2.col && coord1.row === coord2.row;
    }

    public getBrushSize(editorContext: EditorContext): { width: number, height: number } {
        return { width: 1, height: 1 };
    }

    public drawHoverPreview(pos: Position, layerRenderer: RuleLayerRenderer, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[] {
        const selectedRuleset = this.getSelectedRuleset(editorContext);
        if (!selectedRuleset) return [];

        const coord = layerRenderer.posToCoord(pos); // TODO: Check again, very sus

        const { col, row } = coord;
        if (!session.tilemap.isInBoundary({ col, row })) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.alpha = DrawRuleStrategy.spriteAlpha;
        sprite.width = session.tilemap.tilewidth;
        sprite.height = session.tilemap.tileheight;
        const drawPotision = layerRenderer.coordToPos({ col, row });
        sprite.position.set(drawPotision.x, drawPotision.y);
        
        overlayContainer.addChild(sprite);
        return [sprite];
    }

    public getPayload(pos: Position, layerRenderer: RuleLayerRenderer, editorContext: EditorContext, session: TilemapSession): DrawPayload[] {
        const selectedRuleset = this.getSelectedRuleset(editorContext);
        if (!selectedRuleset) return [];

        const coord = layerRenderer.posToCoord(pos);

        if (coord.col < 0 || coord.col >= session.tilemap.width || coord.row < 0 || coord.row >= session.tilemap.height) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.alpha = DrawRuleStrategy.spriteAlpha;
        sprite.width = session.tilemap.tilewidth;
        sprite.height = session.tilemap.tileheight;
        const drawPotision = layerRenderer.coordToPos({ col: coord.col, row: coord.row });
        sprite.position.set(drawPotision.x, drawPotision.y);
        
        return [{ key: `${coord.col},${coord.row}`, sprite, coordinate: coord, position: drawPotision, rulesetId: selectedRuleset.id }];
    }

    public commit(layerRenderer: RuleLayerRenderer, previewData: DrawPayload[], editorContext: EditorContext): void {
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!historyManager) return;

        const updates = previewData.map((data) => {
            const { col, row } = data.coordinate;
            return { coordinate: { col, row }, rulesetId: data.rulesetId };
        });

        if (updates.length == 0) return;

        historyManager.startTransaction();
        historyManager.execute(new SetRuleRefsCommand(layerRenderer.layer.id, updates), editorContext);
        historyManager.commitTransaction();
    }

    private getSelectedRuleset(editorContext: EditorContext) {
        const selectedRuleId = editorContext.workspaceManager.currentWorkspace?.rulesetSessionManager.getSelectedRuleId();
        if (!selectedRuleId) return null;
        const currentProject = editorContext.currentProject;
        if (!currentProject) return null;
        return currentProject.rulesetManager.getRulesetById(selectedRuleId);
    }
}