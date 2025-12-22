import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemapSession";
import { TilesetSessionManagerSchema } from "./tilesetSession";

export const WorkpsaceSchema = type({
    tilesets: TilesetSessionManagerSchema,
    tilemaps: TilemapSessionManagerSchema
})

export type WorkpsaceData = typeof WorkpsaceSchema.infer