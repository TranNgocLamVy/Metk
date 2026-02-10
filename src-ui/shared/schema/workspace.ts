import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemapSession";
import { TilesetSessionManagerSchema } from "./tilesetSession";
import { ToolStateSchema } from "./toolSession";

export const WorkpsaceSchema = type({
    toolState: ToolStateSchema,
    tilesets: TilesetSessionManagerSchema,
    tilemaps: TilemapSessionManagerSchema
})

export type WorkpsaceData = typeof WorkpsaceSchema.infer