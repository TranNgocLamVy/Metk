
import { VStack } from "../../custom/stack/Stack";
import TilemapEditorCanvas from "./TilemapEditorCanvas";
import TilemapEditorTabs from "./TilemapEditorTabs";

export default function TilemapEditor() {
    return (
        <VStack className="tilemapeditor w-full h-full">
            <TilemapEditorTabs />
            <TilemapEditorCanvas />
        </VStack>
    );
}