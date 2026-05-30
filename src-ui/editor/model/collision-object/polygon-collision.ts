import { PolygonCollisionData } from "@/shared/data-types/collision-object.data";
import { CollisionObject } from "./collision-object";

export class PolygonCollision extends CollisionObject {
    public points: Point2D[];

    public constructor(data: PolygonCollisionData) {
        super(data);
        this.points = data.points.map((point) => ({ ...point }));
    }

    public get kind(): "polygon" {
        return "polygon";
    }

    public movePoint(index: number, x: number, y: number): void {
        if (this.locked) return;
        if (!this.points[index]) return;

        this.points[index] = { x, y };
    }

    public insertPoint(index: number, point: Point2D): void {
        if (this.locked) return;
        this.points.splice(index, 0, point);
    }

    public removePoint(index: number): void {
        if (this.locked) return;
        if (this.points.length <= 3) return;

        this.points.splice(index, 1);
    }

    public clone(): PolygonCollision {
        return new PolygonCollision(this.serialize());
    }

    public serialize(): PolygonCollisionData {
        return {
            id: this.id,
            kind: "polygon",
            name: this.name,
            x: this.x,
            y: this.y,
            points: this.points.map((point) => ({ ...point })),
            visible: this.visible,
            locked: this.locked,
        };
    }
}