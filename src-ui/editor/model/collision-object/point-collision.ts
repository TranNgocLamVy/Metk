import { PointCollisionData } from "@/shared/data-types/collision-object.data";
import { CollisionObject } from "./collision-object";

export class PointCollision extends CollisionObject {
    public constructor(data: PointCollisionData) {
        super(data);
    }
    public get kind(): "point" {
        return "point";
    }

    public clone(): PointCollision {
        return new PointCollision(this.serialize());
    }

    public serialize(): PointCollisionData {
        return {
            id: this.id,
            kind: "point",
            name: this.name,
            x: this.x,
            y: this.y,
            visible: this.visible,
            locked: this.locked,
        };
    }
}