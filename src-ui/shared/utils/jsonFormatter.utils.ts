import { Formatter } from "fracturedjsonjs";

const formatter = new Formatter();
formatter.Options.MaxTotalLineLength = 8000; 
formatter.Options.MaxInlineComplexity = 2;
formatter.Options.MinCompactArrayRowItems = 4;

export class JsonFormatter {
    public static format(object: any): string | null {
        const result = formatter.Serialize(object);
        if (!result) return null;
        return result;
    }
}