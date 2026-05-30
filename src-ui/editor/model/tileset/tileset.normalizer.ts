import { CollisionObjectData, CollisionObjectKindValues } from "@/shared/data-types/collision-object.data";
import { ImageSourceData } from "@/shared/data-types/image-source.data";
import { TileData, TilesetData, TilesetType, TilesetTypeValues } from "@/shared/data-types/tileset.data";
import { validate } from "@/shared/utils/validate.utils";

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
        name: validate.string({ value: data.name, defaultValue: "Untitled Tileset" }),
        type: validate.enum({ value: data.type, values: TilesetTypeValues, defaultValue: TilesetType.SingleImage }),
        columns: validate.number({ value: data.columns, defaultValue: 16, min: 1, integer: true }),
        rows: validate.number({ value: data.rows, defaultValue: 16, min: 1, integer: true }),
        tilewidth: validate.number({ value: data.tilewidth, defaultValue: 16, min: 1, integer: true }),
        tileheight: validate.number({ value: data.tileheight, defaultValue: 16, min: 1, integer: true }),
        image,
        tiles,
    };
};

export const extractTilesetId = (tilesetData: unknown): string => {
    const data = validate.requiredObject({ value: tilesetData, field: "tileset" });
    return validate.requiredString({ value: data.id, field: "tileset.id" });
};
