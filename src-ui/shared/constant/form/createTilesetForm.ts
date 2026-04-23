import { FormUtils } from "@/shared/utils/formUtils";

export const createTilesetForm = (textureDefaultDir?: string) => {
    return FormUtils.createForm({
        title: "form.tileset.title",
        okText: "form.tileset.action.create",
        cancelText: "form.tileset.action.cancel",
        size: "md",
        inputs: [
            {
                id: "tileset",
                name: "tileset",
                type: "group",
                label: "form.tileset.tileset",
                inputs: [
                    {
                        id: "name",
                        name: "name",
                        type: "text",
                        label: "form.tileset.name.label",
                        placeholder: "form.tileset.name.placeholder",
                        required: true,
                    }
                ]
            },
            {
                id: "image",
                name: "image",
                type: "group",
                label: "form.tileset.image.label",
                inputs: [
                    {
                        id: "source",
                        name: "source",
                        type: "filePath",
                        defaultDir: textureDefaultDir,
                        multiple: false,
                        label: "form.tileset.image.source",
                        required: true,
                    },
                    {
                        id: "useTransparentColor",
                        name: "useTransparentColor",
                        type: "checkbox",
                        label: "form.tileset.image.useTransparentColor",
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
                                label: "form.tilemap.size.label",
                                visible: false,
                                orientation: "vertical",
                                inputs: [
                                    {
                                        id: "tilewidth",
                                        name: "tilewidth",
                                        type: "number",
                                        label: "form.tilemap.size.width",
                                        defaultValue: 16,
                                        required: true,
                                    },
                                    {
                                        id: "tileheight",
                                        name: "tileheight",
                                        type: "number",
                                        label: "form.tilemap.size.height",
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
                                        label: "form.tileset.margin",
                                        defaultValue: 0,
                                        required: true,
                                    },
                                    {
                                        id: "spaceing",
                                        name: "spaceing",
                                        type: "number",
                                        label: "form.tileset.spacing",
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
}