import { EditorFacade } from "@/application/editor.facade";
import { ITool } from "@/editor/interface/tool.interface";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { TilemapSession } from "@/editor/session/tilemap.session";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { EntityLayerRenderer } from "@/graphics/renderer/tilemap/entity-layer.renderer";
import { EntityRefData } from "@/shared/data-types/layer.data";
import { Color, Container, Sprite, Texture } from "pixi.js";

import { DrawPayload, IDrawStrategy } from "./draw-strategy.interface";
import { AddEntityCommand } from "@/application/commands/layer/add-entity.command";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { appKernel } from "@/application/bootstrap/app-kernel";

export class DrawEntityStrategy implements IDrawStrategy {
    public static readonly spriteAlpha = 0.9;

    public canHandle(layerRenderer: BaseLayerRenderer<any>, tool: ITool): boolean {
        return layerRenderer.layer instanceof EntityLayer;
    }

    public getBrushSize(editorFacade: EditorFacade): { width: number; height: number } {
        const selected = this.getSelectedEntityRef(editorFacade);
        if (!selected) return { width: 1, height: 1 };

        const definition = editorFacade.currentProject?.entityCollectionManager
            .getEntityCollectionById(selected.entityCollectionId)
            ?.getEntityDefinitionById(selected.entityDefinitionId);

        if (!definition) return { width: 1, height: 1 };

        return {
            width: definition.width,
            height: definition.height,
        };
    }

    public comparePosition(
        pos1: Position,
        pos2: Position,
        layerRenderer: EntityLayerRenderer,
    ): boolean {
        if (!pos1 || !pos2 || !layerRenderer) return false;

        return Math.floor(pos1.x) === Math.floor(pos2.x)
            && Math.floor(pos1.y) === Math.floor(pos2.y);
    }

    public getRefAt(pos: Position, layerRenderer: EntityLayerRenderer): any {
        return layerRenderer.layer.getEntityAt(pos);
    }

    public drawHoverPreview(
        pos: Position,
        layerRenderer: EntityLayerRenderer,
        editorFacade: EditorFacade,
        session: TilemapSession,
        overlayContainer: Container,
    ): Sprite[] {
        if (layerRenderer.layer.locked || !layerRenderer.layer.visible) return [];

        const selected = this.getSelectedEntityRef(editorFacade);
        if (!selected) return [];

        const definition = editorFacade.currentProject?.entityCollectionManager
            .getEntityCollectionById(selected.entityCollectionId)
            ?.getEntityDefinitionById(selected.entityDefinitionId);

        if (!definition) return [];

        const sprite = new Sprite();
        sprite.alpha = DrawEntityStrategy.spriteAlpha;

        void applyEntityGraphic(sprite, definition);

        const worldPosition = this.snapToPixel(pos);

        sprite.position.set(
            worldPosition.x - definition.pivotX,
            worldPosition.y - definition.pivotY,
        );

        overlayContainer.addChild(sprite);

        return [sprite];
    }

    public getPayload(
        pos: Position,
        layerRenderer: EntityLayerRenderer,
        editorFacade: EditorFacade,
        session: TilemapSession,
    ): DrawPayload[] {
        if (layerRenderer.layer.locked || !layerRenderer.layer.visible) return [];

        const selected = this.getSelectedEntityRef(editorFacade);
        if (!selected) return [];

        const definition = editorFacade.currentProject?.entityCollectionManager
            .getEntityCollectionById(selected.entityCollectionId)
            ?.getEntityDefinitionById(selected.entityDefinitionId);

        if (!definition) return [];

        const worldPosition = this.snapToPixel(pos);

        const sprite = new Sprite();
        sprite.alpha = DrawEntityStrategy.spriteAlpha;

        void applyEntityGraphic(sprite, definition);

        sprite.position.set(
            worldPosition.x - definition.pivotX,
            worldPosition.y - definition.pivotY,
        );

        // Constant key: one entity placement per stroke.
        // This keeps current behavior close to "click -> add entity".
        return [{
            key: "entity-instance",
            sprite,
            coordinate: layerRenderer.posToCoord(worldPosition),
            position: worldPosition,
            entityRef: selected,
            x: worldPosition.x - layerRenderer.layer.offset.x,
            y: worldPosition.y - layerRenderer.layer.offset.y,
        }];
    }

    public commit(
        layerRenderer: EntityLayerRenderer,
        previewData: DrawPayload[],
        editorFacade: EditorFacade,
    ): void {
        if (layerRenderer.layer.locked || !layerRenderer.layer.visible) return;

        const historyManager = editorFacade.getCurrentHistoryManager();
        if (!historyManager) return;

        const data = previewData[previewData.length - 1];
        if (!data) return;

        historyManager.startTransaction();
        historyManager.execute(
            new AddEntityCommand(
                layerRenderer.tilemap.objectId,
                layerRenderer.layer.objectId,
                {
                    entityRef: data.entityRef,
                    x: data.x,
                    y: data.y,
                    fields: {},
                },
            ),
            editorFacade,
        );
        historyManager.commitTransaction();
    }

    private getSelectedEntityRef(editorFacade: EditorFacade): EntityRefData | null {
        const sessionManager = editorFacade.currentWorkspace?.entityCollectionSessionManager;

        if (!sessionManager) return null;

        const entityCollectionId = sessionManager.getSelectedEntityCollectionId();
        const entityDefinitionId = sessionManager.getSelectedEntityId();

        if (!entityCollectionId || !entityDefinitionId) return null;

        return {
            entityCollectionId,
            entityDefinitionId,
        };
    }

    private snapToPixel(pos: Position): Position {
        return {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
        };
    }
}

async function applyEntityGraphic(
    sprite: Sprite,
    definition: EntityDefinition,
): Promise<void> {
    if (definition.graphic.type === "color") {
        sprite.texture = Texture.WHITE;
        sprite.tint = new Color(definition.graphic.color);
        sprite.width = definition.width;
        sprite.height = definition.height;
        return;
    }

    const texture = appKernel.textureManager.getTileTexture(
        definition.graphic.tilesetId,
        definition.graphic.tileId,
    );

    if (texture) {
        sprite.texture = texture;
        sprite.tint = 0xffffff;
        sprite.width = definition.width;
        sprite.height = definition.height;
        return;
    }

    sprite.texture = await appKernel.textureManager.getErrorTexture();
    sprite.tint = 0xffffff;
    sprite.width = definition.width;
    sprite.height = definition.height;
}