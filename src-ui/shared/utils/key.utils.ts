export class KeyUtils {
    public static getKeystrokeString(e: KeyboardEvent): string {
        const parts: string[] = [];
        
        if (e.ctrlKey) parts.push("Ctrl");
        if (e.shiftKey) parts.push("Shift");
        if (e.altKey) parts.push("Alt");
        if (e.metaKey) parts.push("Cmd"); // Mac Command

        const key = e.key.toUpperCase();
        if (!["CONTROL", "SHIFT", "ALT", "META"].includes(key)) {
            parts.push(key);
        }

        return parts.join("+");
    }
}