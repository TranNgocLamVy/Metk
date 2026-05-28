use tauri::{PhysicalPosition, Window};

#[tauri::command]
fn set_cursor_position(window: Window, x: f64, y: f64) -> Result<(), String> {
    window
        .set_cursor_position(PhysicalPosition::new(x, y))
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn set_cursor_visible(window: Window, visible: bool) -> Result<(), String> {
    window
        .set_cursor_visible(visible)
        .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            set_cursor_position,
            set_cursor_visible,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}