import { useState } from "react";
import { RgbaColor, RgbaColorPicker } from "react-colorful";

export function ColorInput() {
	const [color, setColor] = useState<RgbaColor>({ r: 0, g: 0, b: 0, a: 0 });
	return (
        <div className="color-picker">
            <RgbaColorPicker color={color} onChange={setColor} />
        </div>
    )
}