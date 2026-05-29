import { CollisionObject } from "@/editor/model/collision-object/collision-object";
import { CollisionObjectRenderer, CollisionRenderContext } from "./collision-object-renderer";
import { BoxCollision } from "@/editor/model/collision-object/box-collision";
import { BoxCollisionRenderer } from "./box-collision.renderer";
import { PointCollision } from "@/editor/model/collision-object/point-collision";
import { PointCollisionRenderer } from "./point-collision.renderer";
import { PolygonCollision } from "@/editor/model/collision-object/polygon-collision";
import { PolygonCollisionRenderer } from "./polygon-collision.renderer";

export class CollisionRendererFactory {
    public static create(object: CollisionObject, context: CollisionRenderContext): CollisionObjectRenderer<any> {
        if (object instanceof BoxCollision) {
            return new BoxCollisionRenderer(object, context);
        } else if (object instanceof PointCollision) {
            return new PointCollisionRenderer(object, context);
        } else if (object instanceof PolygonCollision) {
            return new PolygonCollisionRenderer(object, context);
        }
        throw new Error("Unsupported collision object");
    }
}