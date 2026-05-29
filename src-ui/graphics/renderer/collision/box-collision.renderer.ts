import { BoxCollision } from "@/editor/model/collision-object/box-collision";
import { Graphics, Rectangle, type FederatedPointerEvent } from "pixi.js";

import { BoxResizeHandle } from "./collision-editor.controller";
import {
    CollisionObjectRenderer,
    CollisionRenderContext,
} from "./collision-object-renderer";

const HANDLE_SCREEN_SIZE = 8;
const HANDLE_HIT_SCREEN_SIZE = 14;
const MIN_WORLD_SCALE = 0.0001;

const HANDLE_CURSORS: Record<BoxResizeHandle, string> = {
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
    nw: "nwse-resize",
};

type WorldSize = {
    width: number;
    height: number;
};

export class BoxCollisionRenderer extends CollisionObjectRenderer<BoxCollision> {
    private readonly graphics = new Graphics();
    private readonly handles: Graphics[] = [];

    public constructor(object: BoxCollision, context: CollisionRenderContext) {
        super(object, context);

        this.container.sortableChildren = true;

        this.graphics.zIndex = 0;
        this.container.addChild(this.graphics);

        this.bindBodyDrag();
    }

    public render(): void {
        this.graphics.clear();
        this.clearHandles();

        const color = this.context.selected ? 0x00aaff : 0x888888;

        const x = this.toWorldX(this.object.x);
        const y = this.toWorldY(this.object.y);
        const width = this.object.width * this.context.scale.x;
        const height = this.object.height * this.context.scale.y;

        const hitSize = this.screenSizeToWorldSize(HANDLE_HIT_SCREEN_SIZE);

        this.container.hitArea = new Rectangle(
            x - hitSize.width / 2,
            y - hitSize.height / 2,
            width + hitSize.width,
            height + hitSize.height,
        );

        this.graphics.hitArea = new Rectangle(x, y, width, height);

        this.graphics
            .rect(x, y, width, height)
            .stroke({
                color,
                width: 1,
                pixelLine: true,
            })
            .fill({
                color,
                alpha: this.context.selected ? 0.12 : 0.08,
            });

        if (this.context.editable) {
            this.renderHandles(x, y, width, height);
        }
    }

    public destroy(): void {
        this.clearHandles();
        this.container.destroy({ children: true });
    }

    private bindBodyDrag(): void {
        if (!this.context.editable) return;

        this.graphics.eventMode = "static";
        this.graphics.cursor = "move";

        this.graphics.on("pointerdown", (event: FederatedPointerEvent) => {
            event.stopPropagation();
            this.context.editor.beginObjectDrag(this.object, event);
        });
    }

    private renderHandles(
        x: number,
        y: number,
        width: number,
        height: number,
    ): void {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const right = x + width;
        const bottom = y + height;

        const handles: Array<{
            type: BoxResizeHandle;
            x: number;
            y: number;
        }> = [
            { type: "nw", x, y },
            { type: "n", x: centerX, y },
            { type: "ne", x: right, y },
            { type: "e", x: right, y: centerY },
            { type: "se", x: right, y: bottom },
            { type: "s", x: centerX, y: bottom },
            { type: "sw", x, y: bottom },
            { type: "w", x, y: centerY },
        ];

        for (const handle of handles) {
            this.createHandle(handle.type, handle.x, handle.y);
        }
    }

    private createHandle(
        type: BoxResizeHandle,
        x: number,
        y: number,
    ): void {
        const visualSize = this.screenSizeToWorldSize(HANDLE_SCREEN_SIZE);
        const hitSize = this.screenSizeToWorldSize(HANDLE_HIT_SCREEN_SIZE);

        const handle = new Graphics();

        handle.zIndex = 1;
        handle.eventMode = "static";
        handle.cursor = HANDLE_CURSORS[type];

        handle.hitArea = new Rectangle(
            x - hitSize.width / 2,
            y - hitSize.height / 2,
            hitSize.width,
            hitSize.height,
        );

        handle
            .rect(
                x - visualSize.width / 2,
                y - visualSize.height / 2,
                visualSize.width,
                visualSize.height,
            )
            .fill({
                color: 0xffffff,
                alpha: 1,
            })
            .stroke({
                color: 0x00aaff,
                width: 1,
                pixelLine: true,
            });

        handle.on("pointerdown", (event: FederatedPointerEvent) => {
            event.stopPropagation();
            this.context.editor.beginBoxResize(this.object, type, event);
        });

        this.handles.push(handle);
        this.container.addChild(handle);
    }

    private clearHandles(): void {
        for (const handle of this.handles) {
            handle.destroy();
        }

        this.handles.length = 0;
    }

    private screenSizeToWorldSize(size: number): WorldSize {
        const transform = this.context.parent.worldTransform;

        const scaleX = Math.max(
            Math.hypot(transform.a, transform.b),
            MIN_WORLD_SCALE,
        );

        const scaleY = Math.max(
            Math.hypot(transform.c, transform.d),
            MIN_WORLD_SCALE,
        );

        return {
            width: size / scaleX,
            height: size / scaleY,
        };
    }
}