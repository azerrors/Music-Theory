import {createBrowserRouter} from "react-router"
import {MainLayout} from "@/layout/MainLayout"
import {RouteErrorPage} from "@/router/RouteErrorPage"
import {appRoutes} from "@/router/routes"

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout/>,
        errorElement: <RouteErrorPage/>,
        children: appRoutes,
    },
])

export default router
