import { Color, Sprite, Texture } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { EntityInstanceData } from "@/shared/data-types/layer.data";

import { BaseLayerRenderer } from "./base-layer.renderer";

type CreateEntityLayerRendererContext = {
    layer: EntityLayer;
    tilemap: Tilemap;
};

export class EntityLayerRenderer extends BaseLayerRenderer<EntityLayer> {
    private sprites: Map<string, Sprite> = new Map();

    private bindOnEntitiesChanged: (entityIds: string[]) => void;
    private bindOnTextureReloaded: (tilesetId: string) => void;
    private bindOnEntityCollectionUpdated: (entityCollectionId: string) => void;

    constructor(context: CreateEntityLayerRendererContext) {
        super(context.layer, context.tilemap);

        this.bindOnEntitiesChanged = this.onEntitiesChanged.bind(this);
        this.bindOnTextureReloaded = this.onTextureReloaded.bind(this);
        this.bindOnEntityCollectionUpdated = this.onEntityCollectionUpdated.bind(this);

        this.layer.eventEmitter.on("entitiesChanged", this.bindOnEntitiesChanged);

        appKernel.textureManager.on(
            "onTextureReloaded",
            this.bindOnTextureReloaded,
        );

        appKernel.editorFacade.currentProject?.entityCollectionManager.on(
            "onEntityCollectionUpdated",
            this.bindOnEntityCollectionUpdated,
        );

        void this.renderLayer();
    }

    private async renderLayer(): Promise<void> {
        const entities = this.layer.getAllEntities();
        const currentEntityIds = new Set(entities.map((entity) => entity.id));

        this.sprites.forEach((sprite, entityId) => {
            if (currentEntityIds.has(entityId)) return;

            sprite.destroy();
            this.sprites.delete(entityId);
        });

        for (const entity of entities) {
            await this.renderEntity(entity);
        }
    }

    private async renderEntity(entity: EntityInstanceData): Promise<void> {
        const definition = this.layer.getEntityDefinition(entity);

        if (!definition) {
            this.removeEntitySprite(entity.id);
            return;
        }

        let sprite = this.sprites.get(entity.id);

        if (!sprite) {
            sprite = new Sprite();
            sprite.label = `entity:${entity.id}`;
            this.sprites.set(entity.id, sprite);
            this.container.addChild(sprite);
        }

        await this.applyEntityGraphic(sprite, definition);
        this.applyEntityTransform(sprite, entity, definition);
    }

    private async applyEntityGraphic(
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

    private applyEntityTransform(
        sprite: Sprite,
        entity: EntityInstanceData,
        definition: EntityDefinition,
    ): void {
        sprite.x = this.layer.offset.x + entity.x - definition.pivotX;
        sprite.y = this.layer.offset.y + entity.y - definition.pivotY;
        sprite.width = definition.width;
        sprite.height = definition.height;
    }

    private syncEntityTransforms(): void {
        this.sprites.forEach((sprite, entityId) => {
            const entity = this.layer.getEntityById(entityId);

            if (!entity) {
                sprite.destroy();
                this.sprites.delete(entityId);
                return;
            }

            const definition = this.layer.getEntityDefinition(entity);

            if (!definition) {
                sprite.visible = false;
                return;
            }

            sprite.visible = true;
            this.applyEntityTransform(sprite, entity, definition);
        });
    }

    private async onEntitiesChanged(entityIds: string[]): Promise<void> {
        for (const entityId of entityIds) {
            const entity = this.layer.getEntityById(entityId);

            if (!entity) {
                this.removeEntitySprite(entityId);
                continue;
            }

            await this.renderEntity(entity);
        }
    }

    private onTextureReloaded(tilesetId: string): void {
        const shouldRerender = this.layer.getAllEntities().some((entity) => {
            const definition = this.layer.getEntityDefinition(entity);

            return (
                definition?.graphic.type === "tile" &&
                definition.graphic.tilesetId === tilesetId
            );
        });

        if (!shouldRerender) return;

        void this.renderLayer();
    }

    private onEntityCollectionUpdated(entityCollectionId: string): void {
        const shouldRerender = this.layer.getAllEntities().some((entity) => {
            return entity.entityRef.entityCollectionId === entityCollectionId;
        });

        if (!shouldRerender) return;

        void this.renderLayer();
    }

    private removeEntitySprite(entityId: string): void {
        const sprite = this.sprites.get(entityId);
        if (!sprite) return;

        sprite.destroy();
        this.sprites.delete(entityId);
    }

    protected override updateProperties(): void {
        super.updateProperties();
        
        if (!this.sprites) return;

        this.syncEntityTransforms();
    }

    public override posToCoord(pos: Position): Coordinate {
        return {
            col: Math.floor(pos.x),
            row: Math.floor(pos.y),
        };
    }

    public override coordToPos(coord: Coordinate): Position {
        return {
            x: coord.col,
            y: coord.row,
        };
    }

    public override destroy(): void {
        this.layer.eventEmitter.off(
            "entitiesChanged",
            this.bindOnEntitiesChanged,
        );

        appKernel.textureManager.off(
            "onTextureReloaded",
            this.bindOnTextureReloaded,
        );

        appKernel.editorFacade.currentProject?.entityCollectionManager.off(
            "onEntityCollectionUpdated",
            this.bindOnEntityCollectionUpdated,
        );

        this.sprites.forEach((sprite) => sprite.destroy());
        this.sprites.clear();

        super.destroy();
    }
}