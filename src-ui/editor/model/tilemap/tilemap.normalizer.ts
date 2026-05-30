import { RulesetRefData } from "@/shared/data-types/ruleset.data";
import { LayerData } from "@/shared/data-types/layer.data";
import {
    DEFAULT_TILEMAP_BACKGROUND_COLOR,
    DEFAULT_TILEMAP_HEIGHT,
    DEFAULT_TILEMAP_WIDTH,
    DEFAULT_TILE_SIZE,
    TilemapData,
    TilemapOrientationValues,
} from "@/shared/data-types/tilemap.data";
import { TilesetRefData } from "@/shared/data-types/tileset.data";
import { validate } from "@/shared/utils/validate.utils";

type RawRefData = Partial<TilesetRefData & RulesetRefData>;

type RawRefCollection<TRef> = Partial<{
    refs: Partial<TRef>[];
    nextIndex: number;
}>;

type RawTilemapData = Partial<Omit<TilemapData, "tilesets" | "rulesets" | "layers">> & {
    tilesets?: RawRefCollection<TilesetRefData>;
    rulesets?: RawRefCollection<RulesetRefData>;
    layers?: LayerData[];
};

const normalizeRefCollection = <TRef>(value: unknown, normalizeRef: (value: unknown) => TRef): { refs: TRef[]; nextIndex: number } => {
    const refData = validate.object<RawRefCollection<TRef>>({
        value,
        defaultValue: {},
    });

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
        id: validate.requiredString({
            value: data.id,
            field: "tilemap.tilesets.refs[].id",
        }),
        index: validate.number({
            value: data.index,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
        name: validate.string({
            value: data.name,
            defaultValue: "Untitled Tileset",
        }),
    };
};

const normalizeRulesetRef = (value: unknown): RulesetRefData => {
    const data = validate.requiredObject({
        value,
        field: "tilemap.rulesets.refs[]",
    }) as RawRefData;

    return {
        id: validate.requiredString({
            value: data.id,
            field: "tilemap.rulesets.refs[].id",
        }),
        index: validate.number({
            value: data.index,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
        name: validate.string({
            value: data.name,
            defaultValue: "Untitled Ruleset",
        }),
    };
};

export const normalizeTilemapData = (
    tilemapData: unknown,
): TilemapData => {
    const data = validate.requiredObject({
        value: tilemapData,
        field: "tilemap",
    }) as RawTilemapData;

    return {
        id: validate.requiredString({
            value: data.id,
            field: "tilemap.id",
        }),
        name: validate.string({
            value: data.name,
            defaultValue: "Untitled Tilemap",
        }),
        orientation: validate.enum({
            value: data.orientation,
            values: TilemapOrientationValues,
            defaultValue: "orthogonal",
        }),
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
        tilewidth: validate.number({
            value: data.tilewidth,
            defaultValue: DEFAULT_TILE_SIZE,
            min: 1,
            integer: true,
        }),
        tileheight: validate.number({
            value: data.tileheight,
            defaultValue: DEFAULT_TILE_SIZE,
            min: 1,
            integer: true,
        }),
        backgroundcolor: validate.string({
            value: data.backgroundcolor,
            defaultValue: DEFAULT_TILEMAP_BACKGROUND_COLOR,
        }),
        nextTilesetIndex: validate.number({
            value: data.nextTilesetIndex,
            defaultValue: 0,
            min: 0,
            integer: true,
        }),
        tilesets: normalizeRefCollection<TilesetRefData>(
            data.tilesets,
            normalizeTilesetRef,
        ),
        rulesets: normalizeRefCollection<RulesetRefData>(
            data.rulesets,
            normalizeRulesetRef,
        ),
        layers: validate.array<LayerData>({
            value: data.layers,
            defaultValue: [],
        }),
    };
};

export const extractTilemapId = (tilemapData: unknown): string => {
    const data = validate.requiredObject({
        value: tilemapData,
        field: "tilemap",
    }) as RawTilemapData;

    return validate.requiredString({
        value: data.id,
        field: "tilemap.id",
    });
};
