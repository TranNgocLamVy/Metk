import { type } from "arktype";

export const imageSourceSchema = type({
    source: type("string"),
    width: type("number"),
    height: type("number"),
});
export type ImageSourceData = typeof imageSourceSchema.infer;