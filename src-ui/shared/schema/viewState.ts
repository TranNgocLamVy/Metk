import { type } from "arktype";

export const ViewStateSchema = type({
    x: type("number").or("null").default(null),
    y: type("number").or("null").default(null),
    zoom: type("number").default(1),
});
export type ViewState = typeof ViewStateSchema.infer