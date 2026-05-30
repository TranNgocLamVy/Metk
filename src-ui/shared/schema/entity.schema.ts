import { type } from "arktype";
import { safeArray } from "./utils";

const EntityFieldTypeSchema = type("'int' | 'float' | 'bool' | 'string' | 'color' | 'enum' | 'tile' | 'point' | 'entity_ref'");
export type EntityFieldType = typeof EntityFieldTypeSchema.infer;
export const EntityFieldType: Record<string, EntityFieldType>= {
    Int: "int" as EntityFieldType,
    Float: "float" as EntityFieldType,
    Bool: "bool" as EntityFieldType,
    String: "string" as EntityFieldType,
    Color: "color" as EntityFieldType,
    Enum: "enum" as EntityFieldType,
    Tile: "tile" as EntityFieldType,
    Point: "point" as EntityFieldType,
    EntityRef: "entity_ref" as EntityFieldType,
} as const;


const EntityFieldSchema = type({
    id: type("string"),
    name: type("string").optional(),
    type: EntityFieldTypeSchema,
    nullable: type("boolean").optional(),
    value: type("unknown").optional(),
})
export type EntityFieldData = typeof EntityFieldSchema.infer;


const EntityGraphicTypeSchema = type("'tile' | 'color'");
export type EntityGraphicType = typeof EntityGraphicTypeSchema.infer;
export const EntityGraphicType: Record<string, EntityGraphicType> = {
    Tile: "tile" as EntityGraphicType,
    Color: "color" as EntityGraphicType,
} as const;

const BaseEntityGraphicSchema = type({
    type: EntityGraphicTypeSchema,
})

const EntityTileGraphicSchema = BaseEntityGraphicSchema.merge({
    type : type("'tile'"),
    tileId: type("number"),
    tilesetId: type("string"),
})
export type EntityTileGraphicData = typeof EntityTileGraphicSchema.infer;

const EntityColorGraphicSchema = BaseEntityGraphicSchema.merge({
    type : type("'color'"),
    color: type("string"),
})
export type EntityColorGraphicData = typeof EntityColorGraphicSchema.infer;


const EntityGraphicSchema = EntityTileGraphicSchema.or(EntityColorGraphicSchema);
export type EntityGraphicData = typeof EntityGraphicSchema.infer;

export const EntityDefinitionSchema = type({
    id: type("string"),
    name: type("string").optional(),
    width: type("number"),
    height: type("number"),
    graphic: EntityGraphicSchema,
    color: type("string").optional(),
    pivotX: type("number").optional(),
    pivotY: type("number").optional(),
    tags: safeArray(type("string")).optional(),
    fields: safeArray(EntityFieldSchema).optional(),
})
export type EntityDefinitionData = typeof EntityDefinitionSchema.infer;