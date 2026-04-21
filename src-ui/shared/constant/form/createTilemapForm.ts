import { FormUtils } from "@/shared/utils/formUtils";

export const createTilemapForm = () => {
    return FormUtils.createForm({
        title: "form.tilemap.title",
        okText: "form.tilemap.action.create",
        cancelText: "form.tilemap.action.cancel",
        size: "md",
        inputs: [
            {
                id: "name",
                name: "name",
                type: "text",
                label: "form.tilemap.name.label",
                placeholder: "form.tilemap.name.placeholder",
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
                        label: "form.tilemap.size.label",
                        inputs: [
                            {
                                id: "mapwidth",
                                name: "mapwidth",
                                type: "number",
                                label: "form.tilemap.size.width",
                                defaultValue: 64,
                                required: true,
                            },
                            {
                                id: "mapheight",
                                name: "mapheight",
                                type: "number",
                                label: "form.tilemap.size.height",
                                defaultValue: 64,
                                required: true,
                            },
                        ]
                    },
                    {
                        id: "tile",
                        name: "tile",
                        type: "group",
                        label: "form.tilemap.tileSize.label",
                        inputs: [
                            {
                                id: "tilewidth",
                                name: "tilewidth",
                                type: "number",
                                label: "form.tilemap.tileSize.width",
                                defaultValue: 16,
                                required: true,
                            },
                            {
                                id: "tileheight",
                                name: "tileheight",
                                type: "number",
                                label: "form.tilemap.tileSize.height",
                                defaultValue: 16,
                                required: true,
                            },
                        ]
                    },
                ]
            },
        ]
    })
}