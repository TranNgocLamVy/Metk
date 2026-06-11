
import { EntityCollectionRefManager } from "@/application/resources/references/entity-collection-ref.manager";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { BaseObject, BaseObjectEvents, PropertyUpdateMeta } from "@/editor/model/base-object";
import { EnumProperty, Point2DProperty, StringProperty } from "@/editor/properties/properties.decorator";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { TilemapData, type TilemapOrientation } from "@/shared/data-types/tilemap.data";
import { Result } from "@/shared/types/result";
import { RootLayer } from "./layer/root-layer";
import { DEFAULT_TILEMAP_BACKGROUND_COLOR, normalizeTilemapData } from "./tilemap.normalizer";

interface TilemapEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Tilemap extends BaseObject<TilemapEvent> {
    @StringProperty<Tilemap>({
        label: "property.common.id",
        readonly: true,
        get: (target) => target.id,
    })
    public id: string;

    @StringProperty<Tilemap>({
        label: "property.tilemap.name",
        get: (target) => target.name,
        set: (target, value, meta) => { target.rename(value, meta) },
    })
    public name: string;

    @EnumProperty<Tilemap>({
        label: "property.tilemap.orientation",
        group: "property.group.map",
        order: 0,
        readonly: true,
        get: (target) => target.orientation,
        options: () => {
            return [
                { label: "property.tilemap.orientationOptions.orthogonal", value: "orthogonal" },
                { label: "property.tilemap.orientationOptions.isometric", value: "isometric" },
                { label: "property.tilemap.orientationOptions.oblique", value: "oblique" },
                { label: "property.tilemap.orientationOptions.staggered", value: "staggered" },
                { label: "property.tilemap.orientationOptions.hexagonal", value: "hexagonal" },
            ]
        },
    })
    public orientation: TilemapOrientation;
    public backgroundcolor: string;

    @Point2DProperty<Tilemap>({
        label: "property.tilemap.mapSize",
        group: "property.group.map",
        order: 1,
        readonly: true,
        pointLabel: { x: "property.axis.width", y: "property.axis.height" },
        get: (target) => ({ x: target.width, y: target.height }),
    })
    public width: number;
    public height: number;

    @Point2DProperty<Tilemap>({
        label: "property.common.tileSize",
        group: "property.group.map",
        order: 1,
        readonly: true,
        pointLabel: { x: "property.axis.width", y: "property.axis.height" },
        get: (target) => ({ x: target.tileWidth, y: target.tileHeight }),
    })
    public tileWidth: number;
    public tileHeight: number;

    public rootLayer: RootLayer;

    public constructor(
        data: TilemapData,
        public readonly tilemapPathSystem: FilePathSystem,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager,
        public readonly entityCollectionRefManager: EntityCollectionRefManager,
    ) {
        super(`tilemap:${data.id}`);
    
        this.id = data.id;
        this.name = data.name;
        this.orientation = data.orientation;
        this.backgroundcolor = data.backgroundcolor ?? DEFAULT_TILEMAP_BACKGROUND_COLOR;

        this.width = data.width;
        this.height = data.height;
        this.tileWidth = data.tileWidth;
        this.tileHeight = data.tileHeight;

        this.tilesetRefManager.loadData(data.tilesets.refs, data.tilesets.nextIndex);
        this.rulesetRefManager.loadData(data.rulesets.refs, data.rulesets.nextIndex);
        this.entityCollectionRefManager.loadData(
            data.entityCollections.refs,
            data.entityCollections.nextIndex,
        );

        this.rootLayer = new RootLayer(data.layers, this, this.objectId);
    }

    public static createFromFileData(
    tilemapData: unknown,
    tilemapPathSystem: FilePathSystem,
    tilesetRefManager: TilesetRefManager,
    rulesetRefManager: RulesetRefManager,
    entityCollectionRefManager: EntityCollectionRefManager,
): Result<Tilemap> {
    try {
        const data = normalizeTilemapData(tilemapData);
        return Result.Success(
            new Tilemap(
                data,
                tilemapPathSystem,
                tilesetRefManager,
                rulesetRefManager,
                entityCollectionRefManager,
            ),
        );
    } catch (error) {
        return Result.Error(`Failed to create tilemap: ${String(error)}`);
    }
}

    public rename(newName: string, meta?: PropertyUpdateMeta) {
        this.name = newName;
        this.emitUpdateProperty("name", newName, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "Tilemap.rename",
        });
    }

    public serialize(): TilemapData {
        return {
            id: this.id,
            name: this.name,
            orientation: this.orientation,
            height: this.height,
            width: this.width,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            backgroundcolor: this.backgroundcolor,
            tilesets: this.tilesetRefManager.serialize(),
            rulesets: this.rulesetRefManager.serialize(),
            entityCollections: this.entityCollectionRefManager.serialize(),
            layers: this.rootLayer.serialize(),
        }
    }

    public removeRulesetRef(ruleset: string | number): boolean {
        const rulesetIndex = this.rulesetRefManager.removeRulesetRef(ruleset);
        if (rulesetIndex === -1) return false;
        this.rootLayer.removeRulesetRef(rulesetIndex);
        return true;
    }

    public removeTilesetRef(tileset: string | number): boolean {
        const tilesetIndex = this.tilesetRefManager.removeTilesetRef(tileset);
        if (tilesetIndex === -1) return false;
        this.rootLayer.removeTilesetRef(tilesetIndex);
        return true;
    }

    public removeEntityCollectionRef(entityCollectionId: string): boolean {
        const entityCollectionIndex =
            this.entityCollectionRefManager.removeEntityCollectionRef(entityCollectionId);
    
        if (entityCollectionIndex === -1) return false;
    
        this.rootLayer.removeEntityCollectionRef(entityCollectionId);
    
        return true;
    }

    public isInBoundary(coordinate: Coordinate): boolean {
        if (coordinate.col < 0 || coordinate.col >= this.width) return false;
        if (coordinate.row < 0 || coordinate.row >= this.height) return false;
        return true;
    }

    public override getObjectChildren(): BaseObject<any>[] {
        return [this.rootLayer];
    }
    
    public override destroy(): void {
        this.rootLayer.destroy();
        super.destroy();
    }
}
