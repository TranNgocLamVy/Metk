import { CollisionObjectData } from "@/shared/data-types/collision-object.data";
import { CollisionObject } from "./collision-object";
import { BoxCollision } from "./box-collision";
import { PointCollision } from "./point-collision";
import { PolygonCollision } from "./polygon-collision";

export class CollisionObjectFactory {
    public static fromData(data: CollisionObjectData): CollisionObject | null {
        switch (data.kind) {
            case "box":
                return new BoxCollision(data);
            case "point":
                return new PointCollision(data);
            case "polygon":
                return new PolygonCollision(data);
            default:
                // TODO: Log error
                return null;
        }
    }
}