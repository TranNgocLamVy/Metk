import { Texture } from "pixi.js";

import { Result } from "@/appcore/interface/common/result";
import { ITileData, ITilelayer, TilelayerEvent } from "@/appcore/interface/tile/ITilelayer";
import { BaseObject } from "@/appcore/models/core/BaseObject";

export abstract class BaseTileLayer extends BaseObject<TilelayerEvent> implements ITilelayer {
    public id: string;
    protected name: string;
    // protected layerClass: string;
    // protected coordinate: { x: number, y: number } = { x: 0, y: 0 };
    // protected offset: { x: number, y: number } = { x: 0, y: 0 };
    // protected size: { width: number, height: number }
    // protected opacity: number = 1;
    protected visible: boolean = true;
    protected locked: boolean = false;

    public getName(): string {
        return this.name;
    }
    public setName(name: string): Result {
        this.name = name;
        this.emit("Renamed", name);
        return { status: "Success" };
    }
    // public getLayerClass(): string {
    //     return this.layerClass;
    // }
    // public setLayerClass(layerClass: string): void {
    //     this.layerClass = layerClass;
    // }
    // public getSize(): { width: number, height: number } {
    //     return this.size;
    // }
    // public resize(width: number, height: number): void {
    //     this.size = { width, height }
    //     this.emit("Resized", { width, height })
    // }
    // public isVisible(): boolean {
    //     return this.visible;
    // }
    // public setVisible(visible: boolean): void {
    //     this.visible = visible;
    //     this.emit("ChangeVisible", visible);
    // }
    // public isLocked(): boolean {
    //     return this.locked;
    // }
    // public setLocked(locked: boolean): void {
    //     this.locked = locked;
    //     this.emit("ChangeLocked", locked);
    // }
    // public getOpacity(): number {
    //     return this.opacity;
    // }
    // public setOpacity(opacity: number): void {
    //     this.opacity = opacity;
    //     this.emit("ChangeOpacity", opacity)
    // }
    abstract getTileAt(index: number): BaseTileData;
    abstract setTileAt(position: { x: number, y: number }, tile: any): Result;
}

export abstract class BaseTileData implements ITileData {
    abstract getCoordinate(): { x: number, y: number };

    abstract getTexture(): Texture;
}