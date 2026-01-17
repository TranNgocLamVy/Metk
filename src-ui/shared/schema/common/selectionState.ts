import { type } from "arktype";

export const SelectionStateSchema = type({
    selectedTilesSet: "number[]",
    pivot: type({
        row: "number",
        col: "number",
    }).optional(),
});
export type SelectionState = typeof SelectionStateSchema.infer