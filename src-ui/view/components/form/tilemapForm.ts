import { FormService } from "@/shared/services/formService";

export const createTilemapForm = FormService.createForm({
    title: "Create new Tilemap",
    okText: "Create",
    cancelText: "Cancel",
    size: "md",
    inputs: [
        {
            id: "name",
            name: "name",
            type: "text",
            label: "Map Name",
            placeholder: "Your Tile Map",
            required: true,
        },
        {
            id: "options",
            name: "options",
            type: "group",
            label: "Map Options",
            orientation: "horizontal",
            visible: false,
            inputs: [
                {
                    id: "map",
                    name: "map",
                    type: "group",
                    label: "Map Size",
                    inputs: [
                        {
                            id: "mapwidth",
                            name: "mapwidth",
                            type: "number",
                            label: "Width",
                            defaultValue: 64,
                            required: true,
                        },
                        {
                            id: "mapheight",
                            name: "mapheight",
                            type: "number",
                            label: "Height",
                            defaultValue: 64,
                            required: true,
                        },
                        {
                            id: "infinite",
                            name: "infinite",
                            type: "checkbox",
                            label: "Infinite",
                            required: false,
                        },
                    ]
                },
                {
                    id: "tile",
                    name: "tile",
                    type: "group",
                    label: "Tile Size",
                    inputs: [
                        {
                            id: "tilewidth",
                            name: "tilewidth",
                            type: "number",
                            label: "Width",
                            defaultValue: 16,
                            required: true,
                        },
                        {
                            id: "tileheight",
                            name: "tileheight",
                            type: "number",
                            label: "Height",
                            defaultValue: 16,
                            required: true,
                        },
                    ]
                },
            ]
        },
    ]
})