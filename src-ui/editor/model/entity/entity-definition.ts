import { BaseObject, BaseObjectEvents, PropertyUpdateMeta } from "@/editor/model/base-object";
import { EntityDefinitionData, EntityFieldData, EntityGraphicData } from "@/shared/data-types/entity.data";
import { normalizeEntityDefinitionData } from "./entity.normalizer";

export interface EntityDefinitionEvent extends BaseObjectEvents {
    update: (entity: EntityDefinition) => void;
    updateGraphic: (graphic: EntityGraphicData) => void;
    updateFields: (fields: EntityFieldData[]) => void;
}

export class EntityDefinition extends BaseObject<EntityDefinitionEvent> {
    public readonly id: string;
    public name: string;
    public width: number;
    public height: number;
    public graphic: EntityGraphicData;
    public color: string;
    public pivotX: number;
    public pivotY: number;
    public tags: string[];
    public fields: EntityFieldData[];

    public constructor(entityData: EntityDefinitionData) {
        const data = normalizeEntityDefinitionData(entityData);

        super(`entity-definition:${data.id}`, data.cloneFrom);

        this.id = data.id;
        this.name = data.name ?? data.id;
        this.width = data.width;
        this.height = data.height;
        this.graphic = data.graphic;
        this.color = data.color ?? "#ffffff";
        this.pivotX = data.pivotX ?? 0;
        this.pivotY = data.pivotY ?? 0;
        this.tags = data.tags ?? [];
        this.fields = data.fields ?? [];
    }

    public updateEntityDefinition(entityData: EntityDefinitionData, meta?: PropertyUpdateMeta): void {
        const data = normalizeEntityDefinitionData({
            ...entityData,
            id: this.id,
        });

        this.name = data.name ?? data.id;
        this.width = data.width;
        this.height = data.height;
        this.graphic = data.graphic;
        this.color = data.color ?? "#ffffff";
        this.pivotX = data.pivotX ?? 0;
        this.pivotY = data.pivotY ?? 0;
        this.tags = data.tags ?? [];
        this.fields = data.fields ?? [];

        this.emitUpdated("EntityDefinition.updateEntityDefinition", meta);
    }

    public rename(name: string, meta?: PropertyUpdateMeta): void {
        this.name = name;

        this.emitUpdateProperty("name", this.name, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityDefinition.rename",
        });

        this.eventEmitter.emit("update", this);
    }

    public resize(width: number, height: number, meta?: PropertyUpdateMeta): void {
        this.width = Math.max(1, Math.floor(width));
        this.height = Math.max(1, Math.floor(height));

        this.emitUpdateProperty("width", this.width, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityDefinition.resize",
        });

        this.emitUpdateProperty("height", this.height, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityDefinition.resize",
        });

        this.eventEmitter.emit("update", this);
    }

    public setGraphic(graphic: EntityGraphicData, meta?: PropertyUpdateMeta): void {
        const data = normalizeEntityDefinitionData({
            ...this.serialize(),
            graphic,
        });

        this.graphic = data.graphic;

        this.emitUpdateProperty("graphic", this.graphic, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityDefinition.setGraphic",
        });

        this.eventEmitter.emit("updateGraphic", this.graphic);
        this.eventEmitter.emit("update", this);
    }

    public setFields(fields: EntityFieldData[], meta?: PropertyUpdateMeta): void {
        const data = normalizeEntityDefinitionData({ ...this.serialize(), fields});

        this.fields = data.fields ?? [];

        this.emitUpdateProperty("fields", this.fields, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityDefinition.setFields",
        });

        this.eventEmitter.emit("updateFields", this.fields);
        this.eventEmitter.emit("update", this);
    }

    public setTags(tags: string[], meta?: PropertyUpdateMeta): void {
        const data = normalizeEntityDefinitionData({ ...this.serialize(), tags });

        this.tags = data.tags ?? [];

        this.emitUpdateProperty("tags", this.tags, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityDefinition.setTags",
        });

        this.eventEmitter.emit("update", this);
    }

    public serialize(): EntityDefinitionData {
        return {
            id: this.id,
            ...(this.cloneFrom ? { cloneFrom: this.cloneFrom } : {}),
            name: this.name,
            width: this.width,
            height: this.height,
            graphic: this.graphic,
            color: this.color,
            pivotX: this.pivotX,
            pivotY: this.pivotY,
            tags: [...this.tags],
            fields: this.fields.map((field) => ({ ...field })),
        };
    }

    private emitUpdated(source: string, meta?: PropertyUpdateMeta): void {
        this.emitUpdateProperty("name", this.name, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? source,
        });

        this.emitUpdateProperty("graphic", this.graphic, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? source,
        });

        this.emitUpdateProperty("fields", this.fields, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? source,
        });

        this.eventEmitter.emit("update", this);
    }
}
