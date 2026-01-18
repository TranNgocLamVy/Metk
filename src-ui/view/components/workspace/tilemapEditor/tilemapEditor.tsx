
import { VStack } from "../../custom/stack/stack";
import TilemapEditorCanvas from "./tilemapEditorCanvas";
import TilemapEditorTabs from "./tilemapEditorTabs";

export default function TilemapEditor() {
    return (
        <VStack className="tilemapeditor w-full h-full">
            <TilemapEditorTabs />
            <TilemapEditorCanvas />
        </VStack>
    );
}