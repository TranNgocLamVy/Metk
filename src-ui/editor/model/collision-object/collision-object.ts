import { BaseCollisionData, CollisionObjectData, CollisionObjectKind } from "@/shared/data-types/collision-object.data";

export abstract class CollisionObject {
    public readonly id: string;
    public name: string;
    public x: number;
    public y: number;
    public visible: boolean;
    public locked: boolean;

    protected constructor(data: BaseCollisionData) {
        this.id = data.id;
        this.name = data.name ?? "Unnamed Collision Object";
        this.x = data.x;
        this.y = data.y;
        this.visible = data.visible ?? true;
        this.locked = data.locked ?? false;
    }

    public moveBy(dx: number, dy: number): void {
        if (this.locked) return;
        this.x += dx;
        this.y += dy;
    }

    public moveTo(x: number, y: number): void {
        if (this.locked) return;
        this.x = x;
        this.y = y;
    }

    public abstract get kind(): CollisionObjectKind;

    public abstract clone(): CollisionObject;

    public abstract serialize(): CollisionObjectData;
}