import { ITilemapExporter } from "@/core/interface/ITilemapExporter";
import { TilemapData } from "@/shared/schema/tilemapSchema";

import { JsonFormatter } from "../../../shared/utils/jsonFormatter";
import { EditorContext } from "../editorContext";

export class JsonFormatterTilemapExporter implements ITilemapExporter {
    public export(tilemapData: TilemapData, editorContext: EditorContext): string {
        return JsonFormatter.format(tilemapData)!;
    }
}