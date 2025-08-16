import { VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";

import { useTestStore } from "./store";

export default function TestPage() {
    const test = useTestStore((s) => s.test);
	const inc = useTestStore((s) => s.test).increment;

	return (
		<VStack>
			<Button onClick={inc}>Test {test.count}</Button>
		</VStack>
	);
}