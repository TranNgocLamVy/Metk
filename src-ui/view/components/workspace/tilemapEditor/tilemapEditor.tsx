
import { VStack } from "../../custom/stack/stack";
import TilemapEditorCanvas from "./tilemapEditorCanvas";

export default function TilemapEditor() {
    return (
        <VStack className="tilemapeditor w-full h-full">
            <TilemapEditorCanvas />
        </VStack>
    );
}