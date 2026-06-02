import { BaseObject, BaseObjectEvents, PropertyUpdateMeta } from "@/editor/model/base-object";
import { EntityInstanceData, EntityRefData } from "@/shared/data-types/layer.data";
import { validate } from "@/shared/utils/validate.utils";
import { v4 as uuidv4 } from "uuid";

export interface EntityInstanceEvents extends BaseObjectEvents {
    update: (entity: EntityInstance) => void;
    moved: (entity: EntityInstance) => void;
}

export class EntityInstance extends BaseObject<EntityInstanceEvents> {
    public readonly id: string;
    public name?: string;
    public entityRef: EntityRefData;
    public x: number;
    public y: number;
    public fields: Record<string, unknown>;

    public constructor(data: EntityInstanceData, objectIdScope: string = "entity") {
        const normalized = EntityInstance.normalizeData(data);

        super(`${objectIdScope}:entity-instance:${normalized.id}`);

        this.id = normalized.id;
        this.name = normalized.name;
        this.entityRef = normalized.entityRef;
        this.x = normalized.x;
        this.y = normalized.y;
        this.fields = normalized.fields ?? {};
    }

    public static fromData(
        data: EntityInstanceData,
        objectIdScope: string = "entity",
    ): EntityInstance {
        return new EntityInstance(data, objectIdScope);
    }

    public static normalizeData(value: unknown): EntityInstanceData {
        const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });
        const entityRef = validate.object<Record<string, unknown>>({
            value: data.entityRef,
            defaultValue: {},
        });

        const entityCollectionId = validate.string({
            value: entityRef.entityCollectionId,
            defaultValue: "",
        });

        const entityDefinitionId = validate.string({
            value: entityRef.entityDefinitionId,
            defaultValue: "",
        });

        if (!entityCollectionId || !entityDefinitionId) {
            throw new Error("Entity instance requires an entity reference");
        }

        const name = validate.string({ value: data.name, defaultValue: "" });

        return {
            id: validate.string({ value: data.id, defaultValue: uuidv4() }),
            ...(name ? { name } : {}),
            entityRef: {
                entityCollectionId,
                entityDefinitionId,
            },
            x: validate.number({ value: data.x, defaultValue: 0 }),
            y: validate.number({ value: data.y, defaultValue: 0 }),
            fields: validate.object<Record<string, unknown>>({
                value: data.fields,
                defaultValue: {},
            }),
        };
    }

    public toData(): EntityInstanceData {
        return {
            id: this.id,
            ...(this.name ? { name: this.name } : {}),
            entityRef: { ...this.entityRef },
            x: this.x,
            y: this.y,
            fields: { ...this.fields },
        };
    }

    public rename(name: string | undefined, meta?: PropertyUpdateMeta): void {
        this.name = name && name.trim() ? name : undefined;

        this.emitUpdateProperty("name", this.name, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityInstance.rename",
        });

        this.eventEmitter.emit("update", this);
    }

    public moveTo(x: number, y: number, meta?: PropertyUpdateMeta): void {
        this.x = x;
        this.y = y;

        this.emitUpdateProperty("position", { x: this.x, y: this.y }, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityInstance.moveTo",
        });

        this.eventEmitter.emit("moved", this);
        this.eventEmitter.emit("update", this);
    }

    public setFields(fields: Record<string, unknown>, meta?: PropertyUpdateMeta): void {
        this.fields = { ...fields };

        this.emitUpdateProperty("fields", this.fields, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityInstance.setFields",
        });

        this.eventEmitter.emit("update", this);
    }
}
