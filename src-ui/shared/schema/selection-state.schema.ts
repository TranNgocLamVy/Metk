import { type } from "arktype";
import { safeArray } from "./utils";

export const SelectionStateSchema = type({
    selectedTilesSet: safeArray(type("number")).default(() => []),
});
export type SelectionState = typeof SelectionStateSchema.infer