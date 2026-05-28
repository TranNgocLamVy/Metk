import { Label } from "@/ui/components/shadcn/label";
import { LocalizedText } from "../custom/LocalizeText";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcn/select";

type SelectFieldProps = {
    id: string;
    name: string;
    label: string;
    required?: boolean;
    disabled?: boolean;
    value?: string;
    defaultValue?: string;
    options: {
        label: string;
        value: string;
        disabled?: boolean;
    }[];
    handleChange?: (fieldName: string, raw: unknown) => void;
};

export function SelectField(props: SelectFieldProps) {
    const { id, name, label, required, disabled, value, defaultValue, options, handleChange } = props;

    const currentValue = value ?? defaultValue ?? options[0]?.value ?? "";

    return (
        <div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
            <Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
            <Select
                name={name}
                required={required}
                disabled={disabled}
                value={currentValue}
                onValueChange={(value) => handleChange?.(name, value)}
            >
                <SelectTrigger size="sm" className="w-full bg-surface-sunken text-2xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-overlay-raised">
                    {options.map((option) => (
                        <SelectItem className="text-foreground text-2xs" disabled={option.disabled ?? false} key={`${option.value}`} value={String(option.value)}>
                            <LocalizedText message={option.label} />
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}