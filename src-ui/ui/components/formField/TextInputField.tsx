import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { useTranslation } from "react-i18next";
import { LocalizedText } from "../custom/LocalizeText";

interface TextInputProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	value?: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
}

export function TextInputField(props: TextInputProps) {
	const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, required, minLength, maxLength, value, handleChange } = props;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        handleChange?.(name, raw);
    }

	return (
		<div className="grid gap-2">
			<Label htmlFor={id}><LocalizedText message={label} /></Label>
			<Input id={id} name={name} type="text" placeholder={translate(placeholder)} required={required} minLength={minLength} maxLength={maxLength} value={value ?? ""} onChange={onChange} className="w-full" />
		</div>
	);
}
