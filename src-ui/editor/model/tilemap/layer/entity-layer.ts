import { v4 as uuidv4 } from "uuid";

import { AddEntityData } from "@/application/commands/layer/add-entity.command";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityInstance } from "@/editor/model/entity/entity-instance";
import { Point2DProperty } from "@/editor/properties/properties.decorator";
import { EntityInstanceData, EntityLayerData, EntityRefData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";
import { validate } from "@/shared/utils/validate.utils";
import { BaseObject, PropertyUpdateMeta } from "../../base-object";
import { Tilemap } from "../tilemap";
import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./base-layer";

export interface EntityLayerEvents extends BaseLayerEvents {
    entitiesChanged: (entityIds: string[]) => void;
    entityAdded: (entity: EntityInstance) => void;
    entityRemoved: (entity: EntityInstance) => void;
}

export class EntityLayer extends BaseLayer<EntityLayerEvents> {
    @Point2DProperty<EntityLayer>({
        label: "property.common.offset",
        group: "property.group.properties",
        order: 4,
        set: (target, value, meta) => target.updateOffset(value.x, value.y, meta),
        get: (target) => ({ x: target.offset.x, y: target.offset.y }),
    })
    public offset: Point2D = { x: 0, y: 0 };

    private entities: EntityInstance[] = [];

    public constructor(
        entityLayerData: EntityLayerData,
        parentLayer: IGroupLayer,
        tilemap: Tilemap,
        objectIdScope: string = parentLayer.objectIdScope,
    ) {
        const data = validate.requiredObject({
            value: entityLayerData,
            field: "entity layer",
        });

        super(
            validate.requiredString({ value: data.id, field: "entity layer.id" }),
            tilemap,
            objectIdScope,
            "Entity Layer",
        );

        this.parentLayer = parentLayer;

        this.name = validate.string({
            value: data.name,
            defaultValue: "Unknow Entity Layer",
        });

        this.opacity = validate.number({
            value: data.opacity,
            defaultValue: 1,
            min: 0,
            max: 1,
        });

        this.visible = validate.boolean({
            value: data.visible,
            defaultValue: true,
        });

        this.locked = validate.boolean({
            value: data.locked,
            defaultValue: false,
        });

        this.offset.x = validate.number({
            value: data.offsetx,
            defaultValue: 0,
        });

        this.offset.y = validate.number({
            value: data.offsety,
            defaultValue: 0,
        });

        const rawEntities = validate.array<unknown>({
            value: data.entities,
            defaultValue: [],
        });

        this.entities = rawEntities
            .map((raw) => this.createEntityInstance(raw))
            .filter((entity): entity is EntityInstance => entity !== null);

        this.entities.forEach((entity) => this.bindEntityInstanceEvents(entity));
    }

    public override getObjectChildren(): BaseObject<any>[] {
        return this.entities;
    }

    public getAllEntities(): EntityInstance[] {
        return [...this.entities];
    }

    public getAllEntityData(): EntityInstanceData[] {
        return this.entities.map((entity) => entity.toData());
    }

    public getEntityById(entityId: string): EntityInstance | null {
        return this.entities.find((entity) => entity.id === entityId) ?? null;
    }

    public getEntityDefinition(entity: EntityInstance | EntityInstanceData | EntityRefData): EntityDefinition | null {
        const entityRef = "entityRef" in entity ? entity.entityRef : entity;
        return this.entityCollectionRefManager.getEntityDefinitionByRef(entityRef);
    }

    public getEntityAt(worldPosition: Point2D): EntityInstance | null {
        const localPosition = {
            x: worldPosition.x - this.offset.x,
            y: worldPosition.y - this.offset.y,
        };

        for (let index = this.entities.length - 1; index >= 0; index--) {
            const entity = this.entities[index];
            const definition = this.getEntityDefinition(entity);

            if (!definition) continue;

            const left = entity.x - definition.pivotX;
            const top = entity.y - definition.pivotY;
            const right = left + definition.width;
            const bottom = top + definition.height;

            if (
                localPosition.x >= left &&
                localPosition.x <= right &&
                localPosition.y >= top &&
                localPosition.y <= bottom
            ) {
                return entity;
            }
        }

        return null;
    }

    public addEntity(data: AddEntityData | EntityInstanceData): Result<EntityInstance> {
        if (this.locked || !this.visible) return Result.Cancel();

        const entity = this.createEntityInstance({
            ...data,
            id: data.id ?? uuidv4(),
        });

        if (!entity) return Result.Error("Invalid entity instance");

        const refIndex = this.entityCollectionRefManager.getEntityCollectionRefIndex(
            entity.entityRef.entityCollectionId,
        );

        if (refIndex === -1) {
            return Result.Error("Entity collection not found");
        }

        const definition = this.getEntityDefinition(entity);

        if (!definition) {
            return Result.Error("Entity definition not found");
        }

        if (this.entities.some((item) => item.id === entity.id)) {
            entity.destroy();
            return Result.Cancel("Entity already exists");
        }

        this.entities.push(entity);
        this.bindEntityInstanceEvents(entity);

        this.eventEmitter.emit("entityAdded", entity);
        this.eventEmitter.emit("entitiesChanged", [entity.id]);

        return Result.Success(entity);
    }

    public removeEntities(entityIds: string[]): Result<EntityInstanceData[]> {
        if (this.locked || !this.visible) return Result.Cancel();

        const entityIdSet = new Set(entityIds);
        const removed: EntityInstance[] = [];

        this.entities = this.entities.filter((entity) => {
            if (!entityIdSet.has(entity.id)) return true;

            removed.push(entity);
            return false;
        });

        if (removed.length === 0) return Result.Cancel("No entity removed");

        removed.forEach((entity) => {
            this.eventEmitter.emit("entityRemoved", entity);
            entity.destroy();
        });

        this.eventEmitter.emit(
            "entitiesChanged",
            removed.map((entity) => entity.id),
        );

        return Result.Success(removed.map((entity) => entity.toData()));
    }

    public updateOffset(x: number, y: number, meta?: PropertyUpdateMeta): void {
        this.offset.x = x;
        this.offset.y = y;

        this.emitUpdateProperty("offset", this.offset, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityLayer.updateOffset",
        });

        this.eventEmitter.emit(
            "entitiesChanged",
            this.entities.map((entity) => entity.id),
        );
    }

    public override removeEntityCollectionRef(entityCollectionId: string): void {
        const removedEntities = this.entities.filter(
            (entity) => entity.entityRef.entityCollectionId === entityCollectionId,
        );
        const removedIds = removedEntities.map((entity) => entity.id);

        if (removedIds.length === 0) return;

        this.entities = this.entities.filter(
            (entity) => entity.entityRef.entityCollectionId !== entityCollectionId,
        );

        removedEntities.forEach((entity) => {
            this.eventEmitter.emit("entityRemoved", entity);
            entity.destroy();
        });

        this.eventEmitter.emit("entitiesChanged", removedIds);
    }

    public override serialize(): EntityLayerData {
        return {
            id: this.id,
            type: "entity",
            name: this.name,
            opacity: this.opacity,
            visible: this._visible,
            locked: this._locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            entities: this.getAllEntityData(),
        };
    }

    public override clone(): EntityLayer {
        const layerData = this.serialize();

        layerData.id = uuidv4();
        layerData.entities = layerData.entities.map((entity) => ({
            ...entity,
            id: uuidv4(),
            entityRef: { ...entity.entityRef },
            fields: entity.fields ? { ...entity.fields } : undefined,
        }));

        return new EntityLayer(layerData, this.parentLayer, this.tilemap, this.objectIdScope);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void): void {
        cb(this);
    }

    public override destroy(): void {
        this.entities.forEach((entity) => entity.destroy());
        super.destroy();
    }

    private createEntityInstance(value: unknown): EntityInstance | null {
        try {
            return EntityInstance.fromData(
                EntityInstance.normalizeData(value),
                this.objectId,
            );
        } catch {
            return null;
        }
    }

    private bindEntityInstanceEvents(entity: EntityInstance): void {
        entity.eventEmitter.on("update", (updatedEntity) => {
            this.eventEmitter.emit("entitiesChanged", [updatedEntity.id]);
        });
    }
}
