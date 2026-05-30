import { type } from "arktype";
import { safeArray } from "./utils";
import { EntityDefinitionSchema } from "./entity.schema";


export const EntityCollectionSchema = type({
    id: type("string"),
    name: type("string").default("Untitled Entity Collection"),
    entities: safeArray(EntityDefinitionSchema).optional(),
})