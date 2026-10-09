import "./i18n"
import "./index.css"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {RouterProvider} from "react-router"
import router from "@/router"
import {SettingsProvider} from "@/provider/SettingsProvider"
import {ErrorBoundary} from "@/widgets/ErrorBoundary"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <SettingsProvider>
                <RouterProvider router={router}/>
            </SettingsProvider>
        </ErrorBoundary>
    </StrictMode>,
)
