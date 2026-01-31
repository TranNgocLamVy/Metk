import DOMPurify from "dompurify";

type Props = {
	svgString: string;
};

export default function SVGIcon({ svgString }: Props) {
	let cleanSVG = DOMPurify.sanitize(svgString);
	return <div dangerouslySetInnerHTML={{ __html: cleanSVG }} />;
}
