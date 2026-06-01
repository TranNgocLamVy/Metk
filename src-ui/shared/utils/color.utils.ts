

export class ColorUtils {
    public static getCSSColor(variableName: string): string | null {
        const root = document.documentElement;
        const rawValue = getComputedStyle(root).getPropertyValue(variableName).trim();

        // Early bail if not a valid color
        if (!CSS.supports('color', rawValue)) {
            return null;
        }

        return rawValue
    }
}