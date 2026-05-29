import { BoxCollisionData } from "@/shared/schema/collision-object.schema";
import { CollisionObject } from "./collision-object";

export class BoxCollision extends CollisionObject {
    public width: number;
    public height: number;

    public constructor(data: BoxCollisionData) {
        super(data);
        this.width = data.width;
        this.height = data.height;
    }

    public get kind(): "box" {
        return "box";
    }

    public resize(width: number, height: number): void {
        if (this.locked) return;
        this.width = Math.max(1, width);
        this.height = Math.max(1, height);
    }

    public clone(): BoxCollision {
        return new BoxCollision(this.serialize());
    }

    public serialize(): BoxCollisionData {
        return {
            id: this.id,
            kind: "box",
            name: this.name,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            visible: this.visible,
            locked: this.locked,
        };
    }
}