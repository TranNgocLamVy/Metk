import { LocalizedText } from "@/ui/components/custom/LocalizeText";

interface FallbackRenderProps {
	error: any;
	resetErrorBoundary: () => void;
}

export function FallbackRender({ error, resetErrorBoundary }: FallbackRenderProps) {
	return (
		<div role="alert" className="w-full h-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold"><LocalizedText message="errorBoundary.title" /></h1>
			<p className="text-red-500">{error.message}</p>
		</div>
	);
}
