import { EntityCollectionRefData } from "@/shared/data-types/entity-collection.data";
import { LayerData } from "@/shared/data-types/layer.data";
import { RulesetRefData } from "@/shared/data-types/ruleset.data";
import { TilemapData, TilemapOrientationValues } from "@/shared/data-types/tilemap.data";
import { TilesetRefData } from "@/shared/data-types/tileset.data";
import { validate } from "@/shared/utils/validate.utils";

export const DEFAULT_TILEMAP_WIDTH = 64;
export const DEFAULT_TILEMAP_HEIGHT = 64;
export const DEFAULT_TILE_SIZE = 16;
export const DEFAULT_TILEMAP_BACKGROUND_COLOR = "#00000000";

type RawRefData = Partial<TilesetRefData & RulesetRefData & EntityCollectionRefData>;

type RawRefCollection<TRef> = Partial<{
    refs: Partial<TRef>[];
    nextIndex: number;
}>;

type RawTilemapData = Partial<Omit<TilemapData, "tilesets" | "rulesets" | "entityCollections" | "layers">> & {
    tilesets?: RawRefCollection<TilesetRefData>;
    rulesets?: RawRefCollection<RulesetRefData>;
    entityCollections?: RawRefCollection<EntityCollectionRefData>;
    layers?: LayerData[];
};

const normalizeRefCollection = <TRef>(value: unknown, normalizeRef: (value: unknown) => TRef): { refs: TRef[]; nextIndex: number } => {
    const refData = validate.object<RawRefCollection<TRef>>({ value, defaultValue: {} });

    const refs = validate.array<unknown>({
        value: refData.refs,
        defaultValue: [],
    })
        .map((ref) => {
            try {
                return normalizeRef(ref);
            } catch {
                return null;
            }
        })
        .filter((ref): ref is TRef => ref !== null);

    return {
        refs,
        nextIndex: validate.number({
            value: refData.nextIndex,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
    };
};

const normalizeTilesetRef = (value: unknown): TilesetRefData => {
    const data = validate.requiredObject({
        value,
        field: "tilemap.tilesets.refs[]",
    }) as RawRefData;

    return {
        id: validate.requiredString({ value: data.id, field: "tilemap.tilesets.refs[].id" }),
        name: validate.string({ value: data.name, defaultValue: "Untitled Tileset" }),
        index: validate.number({
            value: data.index,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
    };
};

const normalizeRulesetRef = (value: unknown): RulesetRefData => {
    const data = validate.requiredObject({ value, field: "tilemap.rulesets.refs[]" }) as RawRefData;

    return {
        id: validate.requiredString({ value: data.id, field: "tilemap.rulesets.refs[].id" }),
        name: validate.string({ value: data.name, defaultValue: "Untitled Ruleset" }),
        index: validate.number({
            value: data.index,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
    };
};

const normalizeEntityCollectionRef = (value: unknown): EntityCollectionRefData => {
    const data = validate.requiredObject({
        value,
        field: "tilemap.entityCollections.refs[]",
    }) as RawRefData;

    return {
        id: validate.requiredString({
            value: data.id,
            field: "tilemap.entityCollections.refs[].id",
        }),
        name: validate.string({
            value: data.name,
            defaultValue: "Untitled Entity Collection",
        }),
        index: validate.number({
            value: data.index,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
    };
};

export const normalizeTilemapData = (tilemapData: unknown): TilemapData => {
    const data = validate.requiredObject({ value: tilemapData, field: "tilemap" }) as RawTilemapData;

    return {
        id: validate.requiredString({ value: data.id, field: "tilemap.id" }),
        name: validate.string({ value: data.name, defaultValue: "Untitled Tilemap" }),
        orientation: validate.enum({ value: data.orientation, values: TilemapOrientationValues, defaultValue: "orthogonal" }),
        width: validate.number({
            value: data.width,
            defaultValue: DEFAULT_TILEMAP_WIDTH,
            min: 1,
            integer: true,
        }),
        height: validate.number({
            value: data.height,
            defaultValue: DEFAULT_TILEMAP_HEIGHT,
            min: 1,
            integer: true,
        }),
        tileWidth: validate.number({
            value: data.tileWidth,
            defaultValue: DEFAULT_TILE_SIZE,
            min: 1,
            integer: true,
        }),
        tileHeight: validate.number({
            value: data.tileHeight,
            defaultValue: DEFAULT_TILE_SIZE,
            min: 1,
            integer: true,
        }),
        entityCollections: normalizeRefCollection<EntityCollectionRefData>(
            data.entityCollections,
            normalizeEntityCollectionRef,
        ),
        backgroundcolor: validate.string({ value: data.backgroundcolor, defaultValue: DEFAULT_TILEMAP_BACKGROUND_COLOR }),
        tilesets: normalizeRefCollection<TilesetRefData>(data.tilesets, normalizeTilesetRef),
        rulesets: normalizeRefCollection<RulesetRefData>(data.rulesets, normalizeRulesetRef),
        layers: validate.array<LayerData>({ value: data.layers, defaultValue: [] }),
    };
};

export const extractTilemapId = (tilemapData: unknown): string => {
    const data = validate.requiredObject({ value: tilemapData, field: "tilemap" }) as RawTilemapData;
    return validate.requiredString({ value: data.id, field: "tilemap.id" });
};
