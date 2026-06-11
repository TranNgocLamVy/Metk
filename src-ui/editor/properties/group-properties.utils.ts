import { BaseProperty } from "./properties";

export interface PropertyGroupModel {
    name: string;
    order: number;
    properties: Array<[string, BaseProperty<any>]>;
}

export function groupProperties(properties: Map<string, BaseProperty<any>>): PropertyGroupModel[] {
    const groups = new Map<string, PropertyGroupModel>();

    for (const [key, property] of properties.entries()) {
        if (!property.visible()) {
            continue;
        }

        const groupName = property.group();

        const group = groups.get(groupName) ?? {
            name: groupName,
            order: getGroupOrder(groupName),
            properties: [],
        };

        group.properties.push([key, property]);
        groups.set(groupName, group);
    }

    return Array.from(groups.values())
        .map(group => ({
            ...group,
            properties: group.properties.sort((a, b) => {
                const orderDiff = a[1].order - b[1].order;

                if (orderDiff !== 0) {
                    return orderDiff;
                }

                return a[1].label.localeCompare(b[1].label);
            }),
        }))
        .sort((a, b) => {
            const orderDiff = a.order - b.order;

            if (orderDiff !== 0) {
                return orderDiff;
            }

            return a.name.localeCompare(b.name);
        });
}

function getGroupOrder(groupName: string): number {
    switch (groupName) {
        case "property.group.general":
            return 0;
        case "property.group.transform":
            return 10;
        case "property.group.rendering":
            return 20;
        case "property.group.physics":
            return 30;
        case "property.group.gameplay":
            return 40;
        case "property.group.custom":
            return 100;
        default:
            return 50;
    }
}