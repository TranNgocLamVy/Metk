import { CollisionObject } from "@/editor/model/collision-object/collision-object";
import { Tile } from "@/editor/model/tileset/tileset";
import { Container } from "pixi.js";
import { CollisionEditorController } from "./collision-editor.controller";
import { TileLayout } from "./tile-layout-resolver";

export type CollisionRenderContext = {
    parent: Container;
    tile: Tile;
    tileOrigin: { x: number; y: number };
    scale: { x: number; y: number };
    editor: CollisionEditorController;
    layout: TileLayout;
    selected: boolean;
    editable: boolean;
};

export abstract class CollisionObjectRenderer<T extends CollisionObject> {
    public readonly container = new Container();

    protected object: T;
    protected context: CollisionRenderContext;

    protected constructor(object: T, context: CollisionRenderContext) {
        this.object = object;
        this.context = context;

        this.container.eventMode = context.editable ? "static" : "none";
        this.container.cursor = context.editable ? "pointer" : "default";
    }

    public abstract render(): void;

    public abstract destroy(): void;

    protected toWorldX(localX: number): number {
        return this.context.tileOrigin.x + localX * this.context.scale.x;
    }

    protected toWorldY(localY: number): number {
        return this.context.tileOrigin.y + localY * this.context.scale.y;
    }

    protected toObjectX(worldX: number): number {
        return (worldX - this.context.tileOrigin.x) / this.context.scale.x;
    }

    protected toObjectY(worldY: number): number {
        return (worldY - this.context.tileOrigin.y) / this.context.scale.y;
    }
}
