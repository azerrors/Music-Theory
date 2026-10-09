import {lazy} from "react"
import type {RouteObject} from "react-router"
import {PATHS} from "@/router/paths"

const HomePage = lazy(() => import("@/pages/HomePage"))
const ChordsPage = lazy(() => import("@/pages/ChordsPage"))
const ChordDetailPage = lazy(() => import("@/pages/ChordDetailPage"))
const ScalesPage = lazy(() => import("@/pages/ScalesPage"))
const ProgressionsPage = lazy(() => import("@/pages/ProgressionsPage"))
const GlossaryPage = lazy(() => import("@/pages/GlossaryPage"))
const SongPage = lazy(() => import("@/pages/SongPage"))
const BuilderPage = lazy(() => import("@/pages/BuilderPage"))
const IntervalsPage = lazy(() => import("@/pages/IntervalsPage"))
const CirclePage = lazy(() => import("@/pages/CirclePage"))
const FretboardPage = lazy(() => import("@/pages/FretboardPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

export const appRoutes: RouteObject[] = [
    {index: true, element: <HomePage/>},
    {path: PATHS.chords, element: <ChordsPage/>},
    {path: PATHS.chordPattern, element: <ChordDetailPage/>},
    {path: PATHS.scales, element: <ScalesPage/>},
    {path: PATHS.progressions, element: <ProgressionsPage/>},
    {path: PATHS.song, element: <SongPage/>},
    {path: PATHS.builder, element: <BuilderPage/>},
    {path: PATHS.intervals, element: <IntervalsPage/>},
    {path: PATHS.circle, element: <CirclePage/>},
    {path: PATHS.glossary, element: <GlossaryPage/>},
    {path: PATHS.fretboard, element: <FretboardPage/>},
    {path: PATHS.settings, element: <SettingsPage/>},
    {path: "*", element: <NotFoundPage/>},
]
