import {Component, type ErrorInfo, type ReactNode} from "react"
import i18n from "@/i18n"
import {Button} from "@/components/ui/button"

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

/** Last-resort fallback for render errors outside the router (router errors use RouteErrorPage). */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {hasError: false}

    static getDerivedStateFromError(): ErrorBoundaryState {
        return {hasError: true}
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info.componentStack)
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <div className="grid min-h-screen place-items-center p-6 text-center">
                <div className="space-y-3">
                    <h1 className="text-2xl font-bold">{i18n.t("error.title")}</h1>
                    <p className="text-base-600 dark:text-base-400">{i18n.t("error.description")}</p>
                    <Button onClick={() => window.location.reload()}>{i18n.t("error.reload")}</Button>
                </div>
            </div>
        )
    }
}
