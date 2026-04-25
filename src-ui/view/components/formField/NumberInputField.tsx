import { Input } from "@/view/components/shadcn/input";
import { Label } from "@/view/components/shadcn/label";
import { useTranslation } from "react-i18next";
import { LocalizedText } from "../custom/LocalizeText";

interface NumberInputProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	required?: boolean;
    min?: number;
    max?: number;
	value?: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
}

export function NumberInputField(props: NumberInputProps) {
    const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, required, min, max, value, handleChange } = props;

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
		<div className="grid gap-2">
			<Label htmlFor={id}><LocalizedText message={label} /></Label>
			<Input id={id} name={name} type="text" placeholder={translate(placeholder)} required={required} value={value ?? ""} onChange={onChange} onBlur={onBlur} className="w-full" />
		</div>
	);
}
