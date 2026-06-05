import { CollisionObjectData, CollisionObjectKindValues } from "@/shared/data-types/collision-object.data";
import { ImageSourceData } from "@/shared/data-types/image-source.data";
import {
    DEFAULT_TILESET_COLUMNS,
    DEFAULT_TILESET_ROWS,
    DEFAULT_TILESET_TILE_HEIGHT,
    DEFAULT_TILESET_TILE_WIDTH,
    TileData,
    TilesetData,
    TilesetType,
    TilesetTypeValues,
} from "@/shared/data-types/tileset.data";
import { validate } from "@/shared/utils/validate.utils";

const normalizeCloneFrom = (value: unknown): string | undefined => {
    return typeof value === "string" && value.length > 0 ? value : undefined;
};

const cloneFromField = (value: unknown): { cloneFrom?: string } => {
    const cloneFrom = normalizeCloneFrom(value);
    return cloneFrom ? { cloneFrom } : {};
};

export const normalizeImageSourceData = (value: unknown): ImageSourceData | undefined => {
    const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });
    if (!("source" in data) && !("width" in data) && !("height" in data)) return undefined;

    return {
        source: validate.string({ value: data.source, defaultValue: "" }),
        width: validate.number({ value: data.width, defaultValue: 0, min: 0 }),
        height: validate.number({ value: data.height, defaultValue: 0, min: 0 }),
    };
};

const normalizeCollisionObjectData = (value: unknown): CollisionObjectData | null => {
    try {
        const data = validate.requiredObject({ value, field: "collision object" });
        const base = {
            id: validate.requiredString({ value: data.id, field: "collisionObject.id" }),
            ...cloneFromField(data.cloneFrom),
            name: validate.string({ value: data.name, defaultValue: "Unnamed Collision Object" }),
            x: validate.number({ value: data.x, defaultValue: 0 }),
            y: validate.number({ value: data.y, defaultValue: 0 }),
            visible: validate.boolean({ value: data.visible, defaultValue: true }),
            locked: validate.boolean({ value: data.locked, defaultValue: false }),
        };
        const kind = validate.requiredEnum({ value: data.kind, values: CollisionObjectKindValues, field: "collisionObject.kind" });

        if (kind === "box") {
            return {
                ...base,
                kind,
                width: validate.number({ value: data.width, defaultValue: 1, min: 1 }),
                height: validate.number({ value: data.height, defaultValue: 1, min: 1 }),
            };
        }

        if (kind === "polygon") {
            const points = validate.array<unknown>({ value: data.points, defaultValue: [] })
                .map((point) => {
                    const pointData = validate.object<Record<string, unknown>>({ value: point, defaultValue: {} });
                    return {
                        x: validate.number({ value: pointData.x, defaultValue: 0 }),
                        y: validate.number({ value: pointData.y, defaultValue: 0 }),
                    };
                });

            return { ...base, kind, points };
        }

        return { ...base, kind };
    } catch {
        return null;
    }
};

export const normalizeTileData = (value: unknown): TileData | null => {
    try {
        const data = validate.requiredObject({ value, field: "tile" });
        const image = normalizeImageSourceData(data.image);
        const collisionObjects = validate.array<unknown>({ value: data.collisionObjects, defaultValue: [] })
            .map(normalizeCollisionObjectData)
            .filter((collisionObject): collisionObject is CollisionObjectData => collisionObject !== null);

        return {
            id: validate.requiredNumber({ value: data.id, field: "tile.id", min: 0, integer: true }),
            ...cloneFromField(data.cloneFrom),
            x: validate.number({ value: data.x, defaultValue: 0 }),
            y: validate.number({ value: data.y, defaultValue: 0 }),
            width: validate.number({ value: data.width, defaultValue: 0, min: 0 }),
            height: validate.number({ value: data.height, defaultValue: 0, min: 0 }),
            image,
            collisionObjects: collisionObjects.length > 0 ? collisionObjects : undefined,
        };
    } catch {
        return null;
    }
};

export const normalizeTilesetData = (tilesetData: unknown): TilesetData => {
    const data = validate.requiredObject({ value: tilesetData, field: "tileset" });
    const image = normalizeImageSourceData(data.image);
    const tiles = validate.array<unknown>({ value: data.tiles, defaultValue: [] })
        .map(normalizeTileData)
        .filter((tile): tile is TileData => tile !== null);

    return {
        id: validate.requiredString({ value: data.id, field: "tileset.id" }),
        ...cloneFromField(data.cloneFrom),
        name: validate.string({ value: data.name, defaultValue: "Untitled Tileset" }),
        type: validate.enum({ value: data.type, values: TilesetTypeValues, defaultValue: TilesetType.SingleImage }),
        columns: validate.number({ value: data.columns, defaultValue: DEFAULT_TILESET_COLUMNS, min: 1, integer: true }),
        rows: validate.number({ value: data.rows, defaultValue: DEFAULT_TILESET_ROWS, min: 1, integer: true }),
        tileWidth: validate.number({ value: data.tileWidth, defaultValue: DEFAULT_TILESET_TILE_WIDTH, min: 1, integer: true }),
        tileHeight: validate.number({ value: data.tileHeight, defaultValue: DEFAULT_TILESET_TILE_HEIGHT, min: 1, integer: true }),
        image,
        tiles,
    };
};

export const extractTilesetId = (tilesetData: unknown): string => {
    const data = validate.requiredObject({ value: tilesetData, field: "tileset" });
    return validate.requiredString({ value: data.id, field: "tileset.id" });
};
