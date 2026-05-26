import { Label } from "@/ui/components/shadcn/label";
import { LocalizedText } from "../custom/LocalizeText";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcn/select";

type SelectFieldProps = {
    id: string;
    name: string;
    label: string;
    required?: boolean;
    value?: string;
    defaultValue?: string;
    options: {
        label: string;
        value: string;
    }[];
    handleChange?: (fieldName: string, raw: unknown) => void;
};

export function SelectField(props: SelectFieldProps) {
    const { id, name, label, required, value, defaultValue, options, handleChange } = props;

    const currentValue = value ?? defaultValue ?? options[0]?.value ?? "";

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                <LocalizedText message={label} />
            </Label>

            <Select
                name={name}
                required={required}
                value={currentValue}
                onValueChange={(value) => handleChange?.(name, value)}
            >
                <SelectTrigger size="sm" className="w-full bg-surface-sunken text-2xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-overlay-raised">
                    {options.map((option) => (
                        <SelectItem className="text-foreground" key={`${option.value}`} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* <select
                id={id}
                name={name}
                required={required}
                value={currentValue}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                onChange={(event) => handleChange?.(name, event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select> */}
        </div>
    );
}