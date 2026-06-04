import { PointCollisionData } from "@/shared/data-types/collision-object.data";
import { v4 as uuidv4 } from "uuid";
import { CollisionObject } from "./collision-object";

export class PointCollision extends CollisionObject {
    public constructor(data: PointCollisionData) {
        super(data);
    }
    public get kind(): "point" {
        return "point";
    }

    public clone(): PointCollision {
        return new PointCollision({
            ...this.serialize(),
            id: uuidv4(),
            cloneFrom: this.id,
        });
    }

    public deepClone(): PointCollision {
        return new PointCollision(this.serialize());
    }

    public serialize(): PointCollisionData {
        return {
            id: this.id,
            ...(this.cloneFrom ? { cloneFrom: this.cloneFrom } : {}),
            kind: "point",
            name: this.name,
            x: this.x,
            y: this.y,
            visible: this.visible,
            locked: this.locked,
        };
    }
}
