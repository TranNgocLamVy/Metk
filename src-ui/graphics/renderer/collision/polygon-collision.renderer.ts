import { PolygonCollision } from "@/editor/model/collision-object/polygon-collision";
import { CollisionObjectRenderer, CollisionRenderContext } from "./collision-object-renderer";
import { Graphics } from "pixi.js";

export class PolygonCollisionRenderer extends CollisionObjectRenderer<PolygonCollision> {
    private graphics = new Graphics();
    private vertexHandles: Graphics[] = [];

    public constructor(object: PolygonCollision, context: CollisionRenderContext) {
        super(object, context);

        this.container.addChild(this.graphics);
        this.bindBodyDrag();
    }

    public render(): void {
        this.graphics.clear();

        if (this.object.points.length === 0) return;

        const color = this.context.selected ? 0x00ff88 : 0x888888;
        const first = this.object.points[0];

        this.graphics.moveTo(
            this.toWorldX(this.object.x + first.x),
            this.toWorldY(this.object.y + first.y),
        );

        for (const point of this.object.points.slice(1)) {
            this.graphics.lineTo(
                this.toWorldX(this.object.x + point.x),
                this.toWorldY(this.object.y + point.y),
            );
        }

        this.graphics.closePath();

        this.graphics
            .fill({ color, alpha: this.context.selected ? 0.12 : 0.08 })
            .stroke({ color, width: 1, pixelLine: true });

        if (this.context.editable) {
            this.renderVertexHandles();
        }
    }

    private renderVertexHandles(): void {
        // one handle per point
        // pointerdown on handle calls editor.beginVertexDrag(...)
    }

    private bindBodyDrag(): void {
        if (!this.context.editable) return;

        this.container.on("pointerdown", (event) => {
            this.context.editor.beginObjectDrag(this.object, event);
        });
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}
