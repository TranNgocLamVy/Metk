import { usePropertyStore } from "@/ui/stores/property.store";
import { VStack } from "../../custom/stack/Stack";
import { ScrollArea } from "../../shadcn/scroll-area";
import { BaseObject } from "@/editor/model/base-object";
import { groupProperties } from "@/editor/properties/group-properties.utils";
import { PropertyGroup } from "./PropertyGroup";

export default function PropertyPanel() {
    const { object } = usePropertyStore();

    return (
        <VStack className="w-full h-full px-1 py-2 inset bg-surface">
            <VStack className="w-full h-full bg-surface-base min-h-0">
                {object && <PropertiesList object={object} />}
            </VStack>
        </VStack>
    )
}

type PropertiesListProps = {
    object: BaseObject;
}
function PropertiesList({ object }: PropertiesListProps) {
    const groups = groupProperties(object.properties);

    return (
        <ScrollArea className="w-full h-full shadow-sm bg-surface-base">
            <VStack>
                {groups.map((group, index) => {
                    const groupIndex = groups.slice(0, index).reduce((acc, curr) => acc + curr.properties.length, 0);
                    return <PropertyGroup key={group.name} group={group} groupIndex={groupIndex} />
                })}
            </VStack>
        </ScrollArea>
    )
}