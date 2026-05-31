import { v4 as uuidv4 } from "uuid";

import { EntityCollectionData, EntityCollectionMetadata, EntityCollectionRefData } from "@/shared/data-types/entity-collection.data";
import { validate } from "@/shared/utils/validate.utils";
import {
    EntityColorGraphicData,
    EntityDefinitionData,
    EntityFieldData,
    EntityFieldType,
    EntityFieldTypeValues,
    EntityGraphicData,
    EntityGraphicType,
    EntityGraphicTypeValues,
    EntityTileGraphicData,
} from "@/shared/data-types/entity.data";

const normalizeId = (value: unknown): string => {
    return typeof value === "string" && value.trim().length > 0 ? value : uuidv4();
};

const normalizeStringArray = (value: unknown): string[] => {
    return validate.array<unknown>({ value, defaultValue: [] }).filter((item): item is string => typeof item === "string");
};

export const normalizeEntityFieldData = (value: unknown): EntityFieldData | null => {
    try {
        const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });
        const id = normalizeId(data.id);
        return {
            id,
            name: validate.string({ value: data.name, defaultValue: id }),
            type: validate.enum({ value: data.type, values: EntityFieldTypeValues, defaultValue: EntityFieldType.String }),
            nullable: validate.boolean({ value: data.nullable, defaultValue: false }),
            value: data.value,
        };
    } catch {
        return null;
    }
};

export const normalizeEntityGraphicData = (value: unknown): EntityGraphicData => {
    const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });

    const type = validate.enum({ value: data.type, values: EntityGraphicTypeValues, defaultValue: EntityGraphicType.Color });

    if (type === EntityGraphicType.Tile) {
        const graphic: EntityTileGraphicData = {
            type: EntityGraphicType.Tile,
            tileId: validate.number({
                value: data.tileId,
                defaultValue: 0,
                min: 0,
                integer: true,
            }),
            tilesetId: validate.string({
                value: data.tilesetId,
                defaultValue: "",
            }),
        };

        return graphic;
    }

    const graphic: EntityColorGraphicData = {
        type: EntityGraphicType.Color,
        color: validate.string({
            value: data.color,
            defaultValue: "#ffffff",
        }),
    };

    return graphic;
};

export const normalizeEntityDefinitionData = (value: unknown): EntityDefinitionData => {
    const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });

    const id = normalizeId(data.id);

    const fields = validate.array<unknown>({
        value: data.fields,
        defaultValue: [],
    }).map(normalizeEntityFieldData).filter((field): field is EntityFieldData => field !== null);

    return {
        id,
        name: validate.string({ value: data.name, defaultValue: id }),
        width: validate.number({
            value: data.width,
            defaultValue: 1,
            min: 1,
            integer: true,
        }),
        height: validate.number({
            value: data.height,
            defaultValue: 1,
            min: 1,
            integer: true,
        }),
        graphic: normalizeEntityGraphicData(data.graphic),
        color: validate.string({ value: data.color, defaultValue: "#ffffff" }),
        pivotX: validate.number({ value: data.pivotX, defaultValue: 0 }),
        pivotY: validate.number({ value: data.pivotY, defaultValue: 0 }),
        tags: normalizeStringArray(data.tags),
        fields,
    };
};

export const normalizeEntityCollectionData = (value: unknown): EntityCollectionData => {
    const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });

    const id = normalizeId(data.id);
    const now = new Date().toISOString();

    const entities = validate.array<unknown>({
        value: data.entities,
        defaultValue: [],
    }).map(normalizeEntityDefinitionData);

    return {
        id,
        name: validate.string({ value: data.name, defaultValue: id }),
        entities,
        createdAt: validate.string({ value: data.createdAt, defaultValue: now }),
        updatedAt: validate.string({ value: data.updatedAt, defaultValue: now }),
    };
};

export const normalizeEntityCollectionMetadata = (value: unknown): EntityCollectionMetadata | null => {
    try {
        const data = validate.requiredObject({ value, field: "entityCollectionMetadata" });

        return {
            id: validate.requiredString({ value: data.id, field: "entityCollectionMetadata.id" }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Entity Collection" }),
            entityCollectionRelPath: validate.requiredString({ value: data.entityCollectionRelPath, field: "entityCollectionMetadata.entityCollectionRelPath" }),
        };
    } catch {
        return null;
    }
};

export const normalizeEntityCollectionRefData = (value: unknown): EntityCollectionRefData | null => {
    try {
        const data = validate.requiredObject({ value, field: "entityCollectionRef" });

        return {
            id: validate.requiredString({ value: data.id, field: "entityCollectionRef.id" }),
            index: validate.number({
                value: data.index,
                defaultValue: 0,
                min: 0,
                integer: true,
            }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Entity Collection" }),
        };
    } catch {
        return null;
    }
};