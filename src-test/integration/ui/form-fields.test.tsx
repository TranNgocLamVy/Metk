import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const formFieldMocks = vi.hoisted(() => ({
    fileDialogs: {
        open: vi.fn(),
    },
}));

vi.mock("@/shared/utils/file-dialog.utils", () => ({ FileDialogUtils: formFieldMocks.fileDialogs }));
vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message?: string) => message ?? "",
    }),
}));
vi.mock("react-color", () => ({
    SketchPicker: ({ onChange }: { onChange: (color: { hex: string }) => void }) => (
        <button type="button" onClick={() => onChange({ hex: "#336699" })}>
            Pick mocked color
        </button>
    ),
}));

import { CheckBoxField } from "@/ui/components/formField/CheckboxField";
import { ColorPickerField } from "@/ui/components/formField/ColorPickerField";
import FilePickerField from "@/ui/components/formField/FilePickerField";
import FolderPickerField from "@/ui/components/formField/FolderPickerField";
import { NumberInputField } from "@/ui/components/formField/NumberInputField";
import { TextInputField } from "@/ui/components/formField/TextInputField";

function ControlledTextField({ onChange }: { onChange: (fieldName: string, raw: unknown) => void }) {
    const [value, setValue] = useState("Untitled");
    return (
        <TextInputField
            id="name"
            name="name"
            label="Project Name"
            value={value}
            handleChange={(fieldName, raw) => {
                setValue(String(raw));
                onChange(fieldName, raw);
            }}
        />
    );
}

function ControlledNumberField({ onChange }: { onChange: (fieldName: string, raw: unknown) => void }) {
    const [value, setValue] = useState("4");
    return (
        <NumberInputField
            id="width"
            name="width"
            label="Width"
            min={2}
            max={10}
            value={value}
            handleChange={(fieldName, raw) => {
                setValue(raw === undefined ? "" : String(raw));
                onChange(fieldName, raw);
            }}
        />
    );
}

function ControlledCheckboxField({ onToggle }: { onToggle: (checked: boolean) => void }) {
    const [checked, setChecked] = useState(false);
    return (
        <CheckBoxField
            id="visible"
            name="visible"
            label="Visible"
            value={checked}
            handleChange={(nextChecked) => {
                setChecked(nextChecked);
                onToggle(nextChecked);
            }}
        />
    );
}

function ControlledColorField({ onChange }: { onChange: (fieldName: string, raw: unknown) => void }) {
    const [color, setColor] = useState("#112233");
    return (
        <ColorPickerField
            id="color"
            name="color"
            label="Color"
            value={color}
            onChange={(fieldName, nextColor) => {
                setColor(nextColor);
                onChange(fieldName, nextColor);
            }}
        />
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    formFieldMocks.fileDialogs.open.mockResolvedValue(null);
});

describe("Metk form fields", () => {
    it("renders controlled text and reports user typing through the field contract", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ControlledTextField onChange={onChange} />);

        const input = screen.getByLabelText("Project Name");
        expect(input).toHaveValue("Untitled");

        await user.clear(input);
        await user.type(input, "Overworld");

        expect(input).toHaveValue("Overworld");
        expect(onChange).toHaveBeenLastCalledWith("name", "Overworld");
    });

    it("parses numbers, clamps max during typing, and applies min on blur", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ControlledNumberField onChange={onChange} />);

        const input = screen.getByLabelText("Width");
        await user.clear(input);
        await user.type(input, "15");

        expect(input).toHaveValue("10");
        expect(onChange).toHaveBeenLastCalledWith("width", 10);

        await user.clear(input);
        await user.type(input, "1");
        await user.tab();

        expect(input).toHaveValue("2");
        expect(onChange).toHaveBeenLastCalledWith("width", 2);

        await user.clear(input);
        expect(onChange).toHaveBeenLastCalledWith("width", undefined);
    });

    it("toggles the checkbox value from user interaction", async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        render(<ControlledCheckboxField onToggle={onToggle} />);

        const checkbox = screen.getByRole("checkbox", { name: "Visible" });
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);

        expect(onToggle).toHaveBeenCalledWith(true);
        expect(checkbox).toBeChecked();
    });

    it("selects files through the mocked file dialog and normalizes a single file to an array", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        formFieldMocks.fileDialogs.open.mockResolvedValue("C:/project/textures/terrain.png");

        render(
            <FilePickerField
                id="texture"
                name="texture"
                label="Texture"
                defaultDir="C:/project/textures"
                filter={{ name: "Images", extensions: ["png"] }}
                value={[]}
                handleChange={onChange}
            />,
        );

        await user.click(screen.getByLabelText("Texture"));

        await waitFor(() => {
            expect(formFieldMocks.fileDialogs.open).toHaveBeenCalledWith({
                directory: false,
                defaultPath: "C:/project/textures",
                multiple: false,
                filters: [{ name: "Images", extensions: ["png"] }],
            });
            expect(onChange).toHaveBeenCalledWith("texture", ["C:/project/textures/terrain.png"]);
        });
    });

    it("selects multiple files and ignores cancelled file selection", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        formFieldMocks.fileDialogs.open.mockResolvedValueOnce(["C:/a.png", "C:/b.png"]).mockResolvedValueOnce(null);

        render(
            <FilePickerField
                id="textures"
                name="textures"
                label="Textures"
                multiple
                value={[]}
                handleChange={onChange}
            />,
        );

        await user.click(screen.getByLabelText("Textures"));
        expect(onChange).toHaveBeenCalledWith("textures", ["C:/a.png", "C:/b.png"]);

        await user.click(screen.getByLabelText("Textures"));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("selects a folder through the mocked dialog and preserves keyboard-only navigation keys", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        formFieldMocks.fileDialogs.open.mockResolvedValue("C:/project/tilemaps");

        render(
            <FolderPickerField
                id="destination"
                name="destination"
                label="Destination"
                defaultDir="C:/project"
                value=""
                handleChange={onChange}
            />,
        );

        const input = screen.getByLabelText("Destination");
        await user.click(input);

        await waitFor(() => {
            expect(formFieldMocks.fileDialogs.open).toHaveBeenCalledWith({
                directory: true,
                defaultPath: "C:/project",
                multiple: false,
            });
            expect(onChange).toHaveBeenCalledWith("destination", "C:/project/tilemaps");
        });
    });

    it("commits valid color text on blur and color picker selection from the dropdown", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ControlledColorField onChange={onChange} />);

        const input = screen.getByLabelText("Color");
        expect(input).toHaveValue("#112233");

        await user.clear(input);
        await user.type(input, "#abcdef");
        await user.tab();

        expect(onChange).toHaveBeenCalledWith("color", "#abcdef");

        const colorSwatch = input.parentElement!.querySelector("div[style]") as HTMLElement;
        await user.click(colorSwatch);
        await user.click(await screen.findByRole("button", { name: "Pick mocked color" }));
        await user.click(screen.getByRole("button", { name: "Select" }));

        expect(onChange).toHaveBeenLastCalledWith("color", "#336699");
    });
});
