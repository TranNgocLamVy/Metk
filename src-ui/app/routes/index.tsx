import HomePage from "./Home";
import Project from "./Project";

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
        path: "/project/:id",
        element: <Project />,
    }
];
