import { PropertyGroupModel } from "@/editor/properties/group-properties.utils";
import PropertyRow from "./PropertyRow";

export interface PropertyGroupProps {
    group: PropertyGroupModel;
    groupIndex: number,
}

export function PropertyGroup({ group, groupIndex }: PropertyGroupProps) {
    return (
        <section className="bg-surface-base">
            <header className="bg-foreground/40 text-accent-foreground/80 px-2 py-1.5 text-xs font-semibold">
                {group.name}
            </header>
            <div className="flex flex-col">
                {group.properties.map((property, index) => (
                    <div className={`${(groupIndex + index) % 2 == 0 ? "bg-surface-base" : "bg-surface-sunken/40"} border-b border-foreground/20`}>
                        <PropertyRow key={property[1].id} property={property[1]} />
                    </div>
                ))}
            </div>
        </section>
    );
}