
interface AutoGridProps extends React.SVGProps<SVGSVGElement> { }
export default function AutoGrid(props: AutoGridProps) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" {...props}>
			<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m14.833 17.75 1.25-1.25 1.25 1.25" />
			<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.417 21.5h-2.5a.833.833 0 0 1-.834-.833V16.5M23.167 20.25l-1.25 1.25-1.25-1.25" />
			<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.583 16.5h2.5a.833.833 0 0 1 .834.833V21.5" />
			<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />
		</svg>
	);
}
