import { Checkbox } from "@/view/components/shadcn/checkbox";
import { Label } from "@/view/components/shadcn/label";
import { useTranslation } from "react-i18next";

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
	const { t: translate } = useTranslation([]);

	const { id, name, label, defaultChecked, required, value, handleChange } = props;

    const onChange = (e: React.ChangeEvent<HTMLButtonElement>) => {
        handleChange?.(!value);
    }

	return (
		<div className="flex gap-3">
			<Checkbox id={id} name={name} checked={value} onChange={onChange} required={required} />
			<Label htmlFor={id}>{translate(label)}</Label>
		</div>
	);
}