import { Checkbox } from "@/ui/components/shadcn/checkbox";
import { Label } from "@/ui/components/shadcn/label";
import { LocalizedText } from "../custom/LocalizeText";

interface CheckBoxProps {
	id: string;
	name: string;
	label: string;
	defaultChecked?: boolean;
    value?: boolean;
	required?: boolean;
	handleChange?: (checked: boolean) => void;
}

export function CheckBoxField(props: CheckBoxProps) {
	const { id, name, label, defaultChecked, required, value, handleChange } = props;

    const onChange = (e: React.ChangeEvent<HTMLButtonElement>) => {
        handleChange?.(!value);
    }

	return (
		<div className="flex gap-3">
			<Checkbox id={id} name={name} checked={value} onChange={onChange} required={required} />
			<Label htmlFor={id}><LocalizedText message={label} /></Label>
		</div>
	);
}