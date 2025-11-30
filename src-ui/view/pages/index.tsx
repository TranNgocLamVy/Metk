import HomePage from "./home/home";
import Project from "./project/project";

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
