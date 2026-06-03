import { Color, Container, Graphics, Sprite, Text, Texture } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityInstance } from "@/editor/model/entity/entity-instance";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

import { Viewport } from "pixi-viewport";
import { BaseLayerRenderer } from "./base-layer.renderer";

type CreateEntityLayerRendererContext = {
    layer: EntityLayer;
    tilemap: Tilemap;
    viewport: Viewport;
};

type EntityDisplayRecord = {
    container: Container;
    sprite: Sprite;
    overlay: Graphics;
    label: Text;
};

type EntityBounds = {
    width: number;
    height: number;
};

const FALLBACK_ENTITY_SIZE = 16;
const LABEL_MARGIN = 4;
const ENTITY_BORDER_COLOR = 0xffffff;
const ENTITY_LABEL_COLOR = 0xffffff;
const ENTITY_LABEL_OUTLINE_COLOR = 0x0f172a;

export class EntityLayerRenderer extends BaseLayerRenderer<EntityLayer> {
    private entityDisplays: Map<string, EntityDisplayRecord> = new Map();

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

        this.removeMissingEntityDisplays(entities);

        for (const entity of entities) {
            await this.syncEntityDisplay(entity);
        }
    }

    private removeMissingEntityDisplays(entities: EntityInstance[]): void {
        const currentEntityIds = new Set(entities.map((entity) => entity.id));

        this.entityDisplays.forEach((record, entityId) => {
            if (currentEntityIds.has(entityId)) return;
            this.destroyEntityDisplay(entityId, record);
        });
    }

    private async syncEntityDisplay(entity: EntityInstance): Promise<void> {
        const definition = this.layer.getEntityDefinition(entity);

        if (!definition) {
            this.removeEntityDisplay(entity.id);
            return;
        }

        const record = this.getOrCreateEntityDisplay(entity.id);

        await this.updateEntityGraphic(record.sprite, definition);
        this.updateEntityTransform(record, entity, definition);
        this.updateEntityOverlay(record, entity, definition);
    }

    private getOrCreateEntityDisplay(entityId: string): EntityDisplayRecord {
        const existing = this.entityDisplays.get(entityId);
        if (existing) return existing;

        const record = this.createEntityDisplay(entityId);

        this.entityDisplays.set(entityId, record);
        this.container.addChild(record.container);

        return record;
    }

    private createEntityDisplay(entityId: string): EntityDisplayRecord {
        const container = new Container();
        container.label = `entity:${entityId}`;

        const sprite = new Sprite();
        sprite.label = `entity:${entityId}:sprite`;

        const overlay = new Graphics();
        overlay.label = `entity:${entityId}:overlay`;

        const label = new Text({
            text: "",
            resolution: 10,
            style: {
                fontFamily: "JetBrains Mono",
                fontSize: 11,
                fill: ENTITY_LABEL_COLOR,
            },
        });
        label.label = `entity:${entityId}:label`;

        label.roundPixels = true;
        sprite.roundPixels = true;

        container.addChild(sprite);
        container.addChild(overlay);
        container.addChild(label);

        return { container, sprite, overlay, label };
    }

    private async updateEntityGraphic(
        sprite: Sprite,
        definition: EntityDefinition,
    ): Promise<void> {
        const bounds = this.getEntityBounds(definition, sprite);

        if (definition.graphic.type === "color") {
            sprite.texture = Texture.WHITE;
            sprite.tint = new Color(definition.graphic.color);
            sprite.width = bounds.width;
            sprite.height = bounds.height;
            return;
        }

        const texture = appKernel.textureManager.getTileTexture(
            definition.graphic.tilesetId,
            definition.graphic.tileId,
        );

        sprite.texture = texture ?? await appKernel.textureManager.getErrorTexture();
        sprite.tint = 0xffffff;
        sprite.width = bounds.width;
        sprite.height = bounds.height;
    }

    private updateEntityTransform(
        record: EntityDisplayRecord,
        entity: EntityInstance,
        definition: EntityDefinition,
    ): void {
        record.container.x = this.layer.offset.x + entity.x - definition.pivotX;
        record.container.y = this.layer.offset.y + entity.y - definition.pivotY;
    }

    private updateEntityOverlay(
        record: EntityDisplayRecord,
        entity: EntityInstance,
        definition: EntityDefinition,
    ): void {
        const bounds = this.getEntityBounds(definition, record.sprite);

        record.overlay.clear()
            .rect(0, 0, bounds.width, bounds.height)
            .stroke({
                color: ENTITY_BORDER_COLOR,
                alpha: 0.85,
                pixelLine: true,
            });

        record.label.text = this.getEntityDisplayName(entity, definition);
        record.label.x = record.sprite.width / 2;
        record.label.y = 0;
        record.label.anchor.set(0.5, 1);
    }

    private getEntityBounds(
        definition: EntityDefinition,
        sprite?: Sprite,
    ): EntityBounds {
        const width = definition.width || sprite?.width || FALLBACK_ENTITY_SIZE;
        const height = definition.height || sprite?.height || FALLBACK_ENTITY_SIZE;

        return {
            width: Math.max(1, width),
            height: Math.max(1, height),
        };
    }

    private getEntityDisplayName(
        entity: EntityInstance,
        definition: EntityDefinition,
    ): string {
        if (entity.name) return entity.name;
        if (definition.name) return definition.name;
        return entity.id;
    }

    private syncEntityDisplays(): void {
        this.entityDisplays.forEach((record, entityId) => {
            const entity = this.layer.getEntityById(entityId);

            if (!entity) {
                this.destroyEntityDisplay(entityId, record);
                return;
            }

            const definition = this.layer.getEntityDefinition(entity);

            if (!definition) {
                record.container.visible = false;
                return;
            }

            record.container.visible = true;
            this.updateEntityTransform(record, entity, definition);
            this.updateEntityOverlay(record, entity, definition);
        });
    }

    private async onEntitiesChanged(entityIds: string[]): Promise<void> {
        for (const entityId of entityIds) {
            const entity = this.layer.getEntityById(entityId);

            if (!entity) {
                this.removeEntityDisplay(entityId);
                continue;
            }

            await this.syncEntityDisplay(entity);
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

    private removeEntityDisplay(entityId: string): void {
        const record = this.entityDisplays.get(entityId);
        if (!record) return;

        this.destroyEntityDisplay(entityId, record);
    }

    private destroyEntityDisplay(
        entityId: string,
        record: EntityDisplayRecord,
    ): void {
        record.container.destroy({ children: true, texture: false });
        this.entityDisplays.delete(entityId);
    }

    protected override updateProperties(): void {
        super.updateProperties();

        if (!this.entityDisplays) return;

        this.syncEntityDisplays();
    }

    public override posToCoord(pos: Point2D): Coordinate {
        return {
            col: Math.floor(pos.x),
            row: Math.floor(pos.y),
        };
    }

    public override coordToPos(coord: Coordinate): Point2D {
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

        this.entityDisplays.forEach((record, entityId) => {
            this.destroyEntityDisplay(entityId, record);
        });
        this.entityDisplays.clear();

        super.destroy();
    }
}
