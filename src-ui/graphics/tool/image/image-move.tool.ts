import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { ImageLayerRenderer } from "@/graphics/renderer/tilemap/image-layer.renderer";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";

export class ImageMoveTool extends PointerTool {
    public override setTargetLayerRenderer(layerRenderer: any): void {
        super.setTargetLayerRenderer(layerRenderer?.layer instanceof ImageLayer ? layerRenderer : null);
    }

    // TODO: Implement image offset movement once an image-layer movement command exists.
}
