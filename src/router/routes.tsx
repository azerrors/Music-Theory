import {lazy} from "react"
import {Navigate, type RouteObject} from "react-router"
import {PATHS, PIANO_PATHS} from "@/router/paths"

const InstrumentPickerPage = lazy(() => import("@/pages/InstrumentPickerPage"))
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
const PianoChordsPage = lazy(() => import("@/pages/PianoChordsPage"))
const PianoChordDetailPage = lazy(() => import("@/pages/PianoChordDetailPage"))
const PianoScalesPage = lazy(() => import("@/pages/PianoScalesPage"))
const PianoBuilderPage = lazy(() => import("@/pages/PianoBuilderPage"))
const PianoProgressionsPage = lazy(() => import("@/pages/PianoProgressionsPage"))
const PianoIntervalsPage = lazy(() => import("@/pages/PianoIntervalsPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

export const appRoutes: RouteObject[] = [
    {index: true, element: <InstrumentPickerPage/>},

    {path: PATHS.home, element: <HomePage/>},
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

    // The piano section has no home page yet; chords are its first tab.
    {path: PIANO_PATHS.home, element: <Navigate to={PIANO_PATHS.chords} replace/>},
    {path: PIANO_PATHS.chords, element: <PianoChordsPage/>},
    {path: PIANO_PATHS.chordPattern, element: <PianoChordDetailPage/>},
    {path: PIANO_PATHS.scales, element: <PianoScalesPage/>},
    {path: PIANO_PATHS.builder, element: <PianoBuilderPage/>},
    {path: PIANO_PATHS.progressions, element: <PianoProgressionsPage/>},
    {path: PIANO_PATHS.intervals, element: <PianoIntervalsPage/>},

    {path: PATHS.settings, element: <SettingsPage/>},
    {path: "*", element: <NotFoundPage/>},
]
