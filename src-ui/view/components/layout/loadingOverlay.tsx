import { Spinner } from "@/view/components/shadcn/spinner";

const LoadingOverlay = ({ isLoading }: { isLoading: boolean }) => {
	if (!isLoading) return null;
	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
			<Spinner className="size-10" />
		</div>
	);
};

export default LoadingOverlay;
