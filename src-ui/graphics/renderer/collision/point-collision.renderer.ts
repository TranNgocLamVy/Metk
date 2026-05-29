import { PointCollision } from "@/editor/model/collision-object/point-collision";
import { CollisionObjectRenderer, CollisionRenderContext } from "./collision-object-renderer";
import { Graphics } from "pixi.js";

export class PointCollisionRenderer extends CollisionObjectRenderer<PointCollision
> {
    private graphics = new Graphics();

    public constructor(object: PointCollision, context: CollisionRenderContext) {
        super(object, context);
        this.container.addChild(this.graphics);

        if (!this.context.editable) return;

        this.container.on("pointerdown", (event) => {
            this.context.editor.beginObjectDrag(this.object, event);
        });
    }

    public render(): void {
        this.graphics.clear();

        const x = this.toWorldX(this.object.x);
        const y = this.toWorldY(this.object.y);
        const color = this.context.selected ? 0xffcc00 : 0x888888;
        const strokeColor = this.context.selected ? 0x000000 : 0x555555;

        this.graphics
            .circle(x, y, 4)
            .fill({ color })
            .stroke({ color: strokeColor, width: 1 });
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}
