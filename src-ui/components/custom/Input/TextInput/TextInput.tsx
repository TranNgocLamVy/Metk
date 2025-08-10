import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

interface TextInputProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultValue?: string;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	value?: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
}

export function TextInputField(props: TextInputProps) {
	const { id, name, label, placeholder, defaultValue, required, minLength, maxLength, value, handleChange } = props;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        handleChange?.(name, raw);
    }

	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Input id={id} name={name} type="text" placeholder={placeholder} defaultValue={defaultValue} required={required} minLength={minLength} maxLength={maxLength} value={value ?? ""} onChange={onChange} className="w-full" />
		</div>
	);
}
