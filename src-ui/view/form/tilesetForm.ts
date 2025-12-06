import { DialogService } from "@/shared/services/dialogService";

export const createTilesetForm = DialogService.createForm({
    title: "Create new Tileset",
    okText: "Create",
    cancelText: "Cancel",
    size: "md",
    inputs: [
        {
            id: "tileset",
            name: "tileset",
            type: "group",
            label: "Tileset",
            inputs: [
                {
                    id: "name",
                    name: "name",
                    type: "text",
                    label: "Map Name",
                    placeholder: "Your Tileset",
                    required: true,
                },
                {
                    id: "destination",
                    name: "destination",
                    type: "folderPath",
                    label: "Destination",
                    required: true,
                }
            ]
        },
        {
            id: "image",
            name: "image",
            type: "group",
            label: "Image",
            inputs: [
                {
                    id: "source",
                    name: "source",
                    type: "filePath",
                    multiple: false,
                    label: "Source",
                    required: true,
                },
                {
                    id: "useTransparentColor",
                    name: "useTransparentColor",
                    type: "checkbox",
                    label: "Use transparent color",
                    required: false,
                },
                {
                    id: "setting",
                    name: "setting",
                    type: "group",
                    label: "Setting",
                    visible: false,
                    orientation: "horizontal",
                    inputs: [
                        {
                            id: "tile",
                            name: "tile",
                            type: "group",
                            label: "Tile",
                            visible: false,
                            orientation: "vertical",
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
                        {
                            id: "marginSpacing",
                            name: "marginAndSpacing",
                            type: "group",
                            label: "MarginAndSpacing",
                            visible: false,
                            orientation: "vertical",
                            inputs: [
                                {
                                    id: "margin",
                                    name: "margin",
                                    type: "number",
                                    label: "Margin",
                                    defaultValue: 0,
                                    required: true,
                                },
                                {
                                    id: "spaceing",
                                    name: "spaceing",
                                    type: "number",
                                    label: "Spaceing",
                                    defaultValue: 0,
                                    required: true,
                                },
                            ]
                        }
                    ]
                },
            ]
        },
    ]
})