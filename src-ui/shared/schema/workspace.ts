import { type } from "arktype";

import { TilesetSessionManagerSchema } from "./tilesetSession";

export const WorkpsaceSchema = type({
    tilesets: TilesetSessionManagerSchema 
})

export type WorkpsaceData = typeof WorkpsaceSchema.infer