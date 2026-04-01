import { type } from "arktype";
import { safeArray } from ".";

export const SelectionStateSchema = type({
    selectedTilesSet: safeArray(type("number")).default(() => []),
    pivot: type({
        row: type("number"),
        col: type("number"),
    }).or("null").default(null),
});
export type SelectionState = typeof SelectionStateSchema.infer