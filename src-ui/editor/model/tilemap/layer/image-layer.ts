import { v4 as uuidv4 } from "uuid";
import { BooleanProperty, ImageSourceProperty, Point2DProperty, StringProperty } from "@/editor/properties/properties.decorator";
import { ImageLayerData } from "@/shared/schema/layer.schema";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./base-layer";
import type { ImageSourceData } from "@/shared/schema/image-source.schema";
import { Tilemap } from "../tilemap";
import type { PropertyUpdateMeta } from "../../base-object";
export interface ImageLayerEvents extends BaseLayerEvents {
    imageChanged: () => void;
}

export class ImageLayer extends BaseLayer<ImageLayerEvents> {
    @StringProperty<ImageLayer>({
        label: "Tint Color",
        group: "Properties",
        order: 5,
        readonly: true,
        get: (target) => target.tintcolor,
        set: (target, value, meta) => target.updateTintColor(value, meta),
    })
    public tintcolor: string = "";

    @BooleanProperty<ImageLayer>({
        label: "Repeat X",
        group: "Properties",
        order: 6,
        get: (target) => target.repeatX,
        set: (target, value, meta) => target.updateRepeat(value, target.repeatY, meta),
    })
    public repeatX: boolean;

    @BooleanProperty<ImageLayer>({
        label: "Repeat Y",
        group: "Properties",
        order: 7,
        get: (target) => target.repeatY,
        set: (target, value, meta) => target.updateRepeat(target.repeatX, value, meta),
    })
    public repeatY: boolean;

    @Point2DProperty<ImageLayer>({
        label: "Offset",
        group: "Properties",
        order: 8,
        set: (target, value, meta) => target.updateOffset(value.x, value.y, meta),
        get: (target) => ({ x: target.offset.x, y: target.offset.y }),
    })
    public offset: Point2D = { x: 0, y: 0 }

    @Point2DProperty<ImageLayer>({
        label: "Parallax",
        group: "Properties",
        order: 9,
        visible: false,
        get: (target) => ({ x: target.parallax.x, y: target.parallax.y }),
    })
    public parallax: Point2D = { x: 1, y: 1 }

    @ImageSourceProperty<ImageLayer>({
        label: "Source",
        group: "Image",
        get: (target) => target.imageSource,
        set: (target, value, meta) => { target.updateImage(value, meta) },
        absToRef: (target, absPath) => { return target.tilemap.tilemapPathSystem.getRelPathFromAbsPath(absPath) }
    })
    public imageSource: ImageSourceData;

    @Point2DProperty<ImageLayer>({
        label: "Size",
        group: "Image",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => !!target.imageSource?.source,
        get: (target) => ({ x: target.imageSource.width!, y: target.imageSource.height! }),
    })
    public readonly size: any;

    constructor(
        imageLayerData: ImageLayerData,
        parentLayer: IGroupLayer,
        tilemap: Tilemap,
        objectIdScope: string = parentLayer.objectIdScope,
    ) {
        super(imageLayerData.id, tilemap, objectIdScope, "Image Layer");

        this.parentLayer = parentLayer;

        this.name = imageLayerData.name ?? "Unknow Image Layer";
        this.opacity = imageLayerData.opacity ?? 1;
        this.visible = imageLayerData.visible ?? true;
        this.locked = imageLayerData.locked ?? false;

        this.offset.x = imageLayerData.offsetx ?? 0;
        this.offset.y = imageLayerData.offsety ?? 0;

        this.parallax.x = imageLayerData.parallaxx ?? 1;
        this.parallax.y = imageLayerData.parallaxy ?? 1;

        this.tintcolor = imageLayerData.tintcolor ?? "";

        this.repeatX = imageLayerData.repeatx ?? false;
        this.repeatY = imageLayerData.repeaty ?? false;

        const imageSourceData = imageLayerData.image ?? { source: "", width: 0, height: 0 };
        this.imageSource = imageSourceData;
    }

    public updateOffset(x: number, y: number, meta?: PropertyUpdateMeta): void {
        this.offset.x = x;
        this.offset.y = y;
        this.emitUpdateProperty("offset", this.offset, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "ImageLayer.updateOffset",
        });
    }

    public updateTintColor(tintcolor: string, meta?: PropertyUpdateMeta): void {
        this.tintcolor = tintcolor;
        this.emitUpdateProperty("tintcolor", this.tintcolor, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "ImageLayer.updateTintColor",
        });
        this.eventEmitter.emit("imageChanged");
    }

    public updateRepeat(x: boolean, y: boolean, meta?: PropertyUpdateMeta): void {
        const previousRepeatX = this.repeatX;
        const previousRepeatY = this.repeatY;

        this.repeatX = x;
        this.repeatY = y;

        const eventMeta = {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "ImageLayer.updateRepeat",
        };

        if (previousRepeatX !== this.repeatX) {
            this.emitUpdateProperty("repeatX", this.repeatX, eventMeta);
        }

        if (previousRepeatY !== this.repeatY) {
            this.emitUpdateProperty("repeatY", this.repeatY, eventMeta);
        }

        this.eventEmitter.emit("imageChanged");
    }

    public updateImage(image: ImageSourceData, meta?: PropertyUpdateMeta): void {
        this.imageSource = image;
        this.emitUpdateProperty("imageSource", this.imageSource, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "ImageLayer.updateImage",
        });
        this.eventEmitter.emit("imageChanged");
    }

    public override serialize(): ImageLayerData {
        return {
            id: this.id,
            type: "image",
            name: this.name,
            opacity: this.opacity,
            visible: this._visible,
            locked: this._locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            parallaxx: this.parallax.x,
            parallaxy: this.parallax.y,
            tintcolor: this.tintcolor,
            repeatx: this.repeatX,
            repeaty: this.repeatY,
            image: this.imageSource,
        };
    }

    public override clone(): ImageLayer {
        const layerData = this.serialize();
        layerData.id = uuidv4();

        return new ImageLayer(layerData, this.parentLayer, this.tilemap, this.objectIdScope);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void): void {
        cb(this);
    }
}
