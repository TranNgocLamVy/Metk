import { type } from "arktype";
import type { Type } from "arktype";

export const safeArray = <S extends Type<any, any>>(schema: S) =>
    type("unknown[]").pipe((elements): typeof schema.infer[] => {
        return elements.reduce((acc: typeof schema.infer[], curr: unknown) => {
            const result = schema(curr);
            if (result instanceof type.errors) {
                console.warn(`Skipped invalid item:\n${result.summary}`);
            } else {
                acc.push(result);
            }
            return acc;
        }, []);
    });