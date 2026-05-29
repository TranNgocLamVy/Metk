import { BoxCollision } from "@/editor/model/collision-object/box-collision";
import { CollisionObjectRenderer, CollisionRenderContext } from "./collision-object-renderer";
import { Graphics } from "pixi.js";

export class BoxCollisionRenderer extends CollisionObjectRenderer<BoxCollision> {
    private graphics = new Graphics();

    public constructor(object: BoxCollision, context: CollisionRenderContext) {
        super(object, context);

        this.container.addChild(this.graphics);
        this.bindBodyDrag();
    }

    public render(): void {
        this.graphics.clear();

        const color = this.context.selected ? 0x00aaff : 0x888888;
        const x = this.toWorldX(this.object.x);
        const y = this.toWorldY(this.object.y);
        const width = this.object.width * this.context.scale.x;
        const height = this.object.height * this.context.scale.y;

        this.graphics
            .rect(x, y, width, height)
            .stroke({ color, width: 1, pixelLine: true })
            .fill({ color, alpha: this.context.selected ? 0.12 : 0.08 });

        if (this.context.editable) {
            this.renderHandles(x, y, width, height);
        }
    }

    private bindBodyDrag(): void {
        if (!this.context.editable) return;

        this.container.on("pointerdown", (event) => {
            this.context.editor.beginObjectDrag(this.object, event);
        });
    }

    private renderHandles(x: number, y: number, width: number, height: number): void {
        // corner handles:
        // top-left, top-right, bottom-right, bottom-left
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}
