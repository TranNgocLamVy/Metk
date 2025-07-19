use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub struct Point {
    x: i32,
    y: i32,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }

    pub fn sum(&self) -> i32 {
        self.x + self.y
    }

    pub fn log(&mut self) {
        web_sys::console::log_1(&"Hello".into());
    }
}
