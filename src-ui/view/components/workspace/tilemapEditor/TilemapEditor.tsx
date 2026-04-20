
import { VStack } from "../../custom/stack/Stack";
import Terminal from "../terminal/Terminal";
import ToolBar from "../ToolBar";
import TilemapEditorCanvas from "./TilemapEditorCanvas";
import TilemapEditorTabs from "./TilemapEditorTabs";

export default function TilemapEditor() {
    return (
        <VStack className="tilemapeditor w-full h-full relative">
            <TilemapEditorTabs />
			<ToolBar />
            <TilemapEditorCanvas />
            <Terminal />
        </VStack>
    );
}