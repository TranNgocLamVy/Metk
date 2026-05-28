
import { BaseObject, BaseObjectEvents, PropertyUpdateMeta } from "@/editor/model/base-object";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { TilemapData, type TilemapOrientation } from "@/shared/schema/tilemap.schema";
import { RootLayer } from "./layer/root-layer";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { EnumProperty, Point2DProperty, StringProperty } from "@/editor/properties/properties.decorator";

interface TilemapEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Tilemap extends BaseObject<TilemapEvent> {
    @StringProperty<Tilemap>({
        label: "ID",
        readonly: true,
        get: (target) => target.id,
    })
    public id: string;

    @StringProperty<Tilemap>({
        label: "Map name",
        get: (target) => target.name,
        set: (target, value, meta) => { target.rename(value, meta) },
    })
    public name: string;

    @EnumProperty<Tilemap>({
        label: "Orientation",
        group: "Map",
        order: 0,
        readonly: true,
        get: (target) => target.orientation,
        options: () => {
            return [
                { label: "Orthogonal", value: "orthogonal" },
                { label: "Isometric", value: "isometric" },
                { label: "Oblique", value: "oblique" },
                { label: "Staggered", value: "staggered" },
                { label: "Hexagonal", value: "hexagonal" },
            ]
        },
    })
    public orientation: TilemapOrientation;
    public backgroundcolor: string;

    @Point2DProperty<Tilemap>({
        label: "Map size",
        group: "Map",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        get: (target) => ({ x: target.width, y: target.height }),
    })
    public width: number;
    public height: number;

    @Point2DProperty<Tilemap>({
        label: "Tile size",
        group: "Map",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        get: (target) => ({ x: target.tilewidth, y: target.tileheight }),
    })
    public tilewidth: number;
    public tileheight: number;

    public rootLayer: RootLayer;

    constructor(
        tilemapData: TilemapData,
        public readonly tilemapPathSystem: FilePathSystem,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super(`tilemap:${tilemapData.id}`);
        this.tilemapPathSystem = tilesetRefManager.filePathSystem;

        this.id = tilemapData.id;
        this.name = tilemapData.name;
        this.orientation = tilemapData.orientation;
        this.backgroundcolor = tilemapData.backgroundcolor ?? "#AARRGGBB";

        this.width = tilemapData.width;
        this.height = tilemapData.height;
        this.tilewidth = tilemapData.tilewidth;
        this.tileheight = tilemapData.tileheight;

        this.tilesetRefManager.loadData(tilemapData.tilesets.refs, tilemapData.tilesets.nextIndex);
        this.rulesetRefManager.loadData(tilemapData.rulesets.refs, tilemapData.rulesets.nextIndex);

        this.rootLayer = new RootLayer(tilemapData.layers, this, this.objectId);
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
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
            backgroundcolor: this.backgroundcolor,
            tilesets: this.tilesetRefManager.serialize(),
            rulesets: this.rulesetRefManager.serialize(),
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
