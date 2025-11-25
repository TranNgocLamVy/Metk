import { Input } from "@/view/components/shadcn/input";
import { Label } from "@/view/components/shadcn/label";

interface NumberInputProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultValue?: string;
	required?: boolean;
    min?: number;
    max?: number;
	value?: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
}

export function NumberInputField(props: NumberInputProps) {
	const { id, name, label, placeholder, defaultValue, required, min, max, value, handleChange } = props;

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
			<Label htmlFor={id}>{label}</Label>
			<Input id={id} name={name} type="text" placeholder={placeholder} defaultValue={defaultValue} required={required} value={value ?? ""} onChange={onChange} onBlur={onBlur} className="w-full" />
		</div>
	);
}
