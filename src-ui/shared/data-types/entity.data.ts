export const EntityFieldTypeValues = [
    "int",
    "float",
    "bool",
    "string",
    "color",
    "enum",
    "tile",
    "point",
    "entity_ref",
] as const;

export type EntityFieldType = typeof EntityFieldTypeValues[number];

export const EntityFieldType = {
    Int: "int",
    Float: "float",
    Bool: "bool",
    String: "string",
    Color: "color",
    Enum: "enum",
    Tile: "tile",
    Point: "point",
    EntityRef: "entity_ref",
} as const satisfies Record<string, EntityFieldType>;

export type EntityFieldData = {
    id: string;
    name?: string;
    type: EntityFieldType;
    nullable?: boolean;
    value?: unknown;
};

export const EntityGraphicTypeValues = ["tile", "color"] as const;
export type EntityGraphicType = typeof EntityGraphicTypeValues[number];

export const EntityGraphicType = {
    Tile: "tile",
    Color: "color",
} as const satisfies Record<string, EntityGraphicType>;

export type EntityTileGraphicData = {
    type: "tile";
    tileId: number;
    tilesetId: string;
};

export type EntityColorGraphicData = {
    type: "color";
    color: string;
};

export type EntityGraphicData = EntityTileGraphicData | EntityColorGraphicData;

export type EntityDefinitionData = {
    id: string;
    name?: string;
    width: number;
    height: number;
    graphic: EntityGraphicData;
    color?: string;
    pivotX?: number;
    pivotY?: number;
    tags?: string[];
    fields?: EntityFieldData[];
};
