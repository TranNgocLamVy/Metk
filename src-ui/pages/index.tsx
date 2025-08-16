import HomePage from "./home/home";
import Project from "./project/project";
import TestPage from "./test/test";

type AppRoute = {
	path: string;
	element: React.ReactNode;
	layout?: React.ReactNode;
	children?: AppRoute[];
};

export const appRoutes: AppRoute[] = [
	{
		path: "/",
		element: <HomePage />,
	},
    {
        path: "/test",
        element: <TestPage />,
    },
    {
        path: "/project/:id",
        element: <Project />,
    }
];
