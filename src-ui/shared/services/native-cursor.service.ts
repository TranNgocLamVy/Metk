import { invoke } from "@tauri-apps/api/core";

export class NativeCursorService {
    public static async setPosition(x: number, y: number): Promise<void> {
        await invoke("set_cursor_position", { x, y });
    }

    public static async setVisible(visible: boolean): Promise<void> {
        await invoke("set_cursor_visible", { visible });
    }
}