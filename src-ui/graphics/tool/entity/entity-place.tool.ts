import { AddEntityCommand } from "@/application/commands/layer/add-entity.command";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { EntityLayerRenderer } from "@/graphics/renderer/tilemap/entity-layer.renderer";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { EntityRefData } from "@/shared/data-types/layer.data";
import { Color, FederatedPointerEvent, Sprite, Texture } from "pixi.js";

export class EntityPlaceTool extends PointerTool {
    private static readonly spriteAlpha = 0.9;

    private hoverSprites: Sprite[] = [];

    public override onDisable(): void {
        this.clearHoverPreview();
    }

    public override detach(): void {
        super.detach();
        this.clearHoverPreview();
    }

    protected override onPointerMove(e: FederatedPointerEvent): void {
        this.clearHoverPreview();
        if (!this.overlayContainer || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        const preview = this.createPreviewSprite(this.getLocalPos(e));
        if (!preview) return;

        this.overlayContainer.addChild(preview);
        this.hoverSprites.push(preview);
    }

    protected override onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const selected = this.getSelectedEntityRef();
        if (!selected) return;

        const definition = this.getEntityDefinition(selected);
        if (!definition) return;

        const session = this.editorFacade.getActiveTilemapSession();
        if (!session) return;
        const historyManager = session.historyManager;

        const worldPosition = this.snapToPixel(this.getLocalPos(e));

        historyManager.startTransaction();
        historyManager.execute(
            new AddEntityCommand(
                this.targetLayerRenderer.tilemap.objectId,
                this.targetLayerRenderer.layer.objectId,
                {
                    entityRef: selected,
                    x: worldPosition.x - this.targetLayerRenderer.layer.offset.x,
                    y: worldPosition.y - this.targetLayerRenderer.layer.offset.y,
                    fields: {},
                },
            ),
            session,
        );
        historyManager.commitTransaction();
    }

    protected override onPointerOutside(e: FederatedPointerEvent): void {
        this.clearHoverPreview();
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is EntityLayerRenderer {
        return layerRenderer?.layer instanceof EntityLayer;
    }

    private createPreviewSprite(pos: Point2D): Sprite | null {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return null;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return null;

        const selected = this.getSelectedEntityRef();
        if (!selected) return null;

        const definition = this.getEntityDefinition(selected);
        if (!definition) return null;

        const sprite = new Sprite();
        sprite.alpha = EntityPlaceTool.spriteAlpha;
        void this.applyEntityGraphic(sprite, definition);

        const worldPosition = this.snapToPixel(pos);
        sprite.position.set(
            worldPosition.x - definition.pivotX,
            worldPosition.y - definition.pivotY,
        );

        return sprite;
    }

    private getSelectedEntityRef(): EntityRefData | null {
        const sessionManager = this.editorFacade.currentWorkspace?.entityCollectionSessionManager;
        if (!sessionManager) return null;

        const entityCollectionId = sessionManager.getSelectedEntityCollectionId();
        const entityDefinitionId = sessionManager.getSelectedEntityId();
        if (!entityCollectionId || !entityDefinitionId) return null;

        return { entityCollectionId, entityDefinitionId };
    }

    private getEntityDefinition(ref: EntityRefData): EntityDefinition | null {
        return this.editorFacade.currentProject?.entityCollectionManager
            .getEntityCollectionById(ref.entityCollectionId)
            ?.getEntityDefinitionById(ref.entityDefinitionId) ?? null;
    }

    private async applyEntityGraphic(sprite: Sprite, definition: EntityDefinition): Promise<void> {
        if (definition.graphic.type === "color") {
            sprite.texture = Texture.WHITE;
            sprite.tint = new Color(definition.graphic.color);
            sprite.width = definition.width;
            sprite.height = definition.height;
            return;
        }

        const texture = this.editorFacade.textureManager.getTileTexture(
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

        sprite.texture = await this.editorFacade.textureManager.getErrorTexture();
        sprite.tint = 0xffffff;
        sprite.width = definition.width;
        sprite.height = definition.height;
    }

    private clearHoverPreview(): void {
        this.hoverSprites.forEach((sprite) => sprite.destroy());
        this.hoverSprites = [];
    }

    private snapToPixel(pos: Point2D): Point2D {
        return {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
        };
    }
}
