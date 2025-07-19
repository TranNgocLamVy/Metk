use std::fs;
use std::path::PathBuf;


// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
	format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_png_file(path: String) -> Result<Vec<u8>, String> {
    let path_buf = PathBuf::from(path);
    if !path_buf.exists() {
        return Err("File does not exist.".to_string());
    }
    match fs::read(&path_buf) {
        Ok(bytes) => Ok(bytes),
        Err(err) => Err(format!("Failed to read file: {}", err)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_png_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
