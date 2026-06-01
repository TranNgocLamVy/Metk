import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { useTranslation } from "react-i18next";

interface NumberInputProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	required?: boolean;
    disabled?: boolean;
    min?: number;
    max?: number;
	value?: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
}

export function NumberInputField(props: NumberInputProps) {
    const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, required, disabled, min, max, value, handleChange } = props;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            handleChange?.(name, undefined);
            return;
        }
        let num = Number(raw.trim())
        if (Number.isNaN(num)) return;
        if (max !== undefined && num > max) num = max;
        handleChange?.(name, num);
    }

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        let num: number = Number(raw.trim())
        if (Number.isNaN(num)) {
            handleChange?.(name, undefined);
            return;
        }
        if (min !== undefined && num < min) num = min;
        handleChange?.(name, num);
    }

	return (
		<div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
			<Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
			<Input 
                id={id} 
                name={name} 
                type="text"
                inputMode="decimal" 
                required={required} 
                disabled={disabled} 
                min={min} 
                max={max} 
                placeholder={translate(placeholder)} 
                value={value ?? ""} 
                onChange={onChange} 
                onBlur={onBlur} 
                className="w-full text-2xs h-6" />
		</div>
	);
}
