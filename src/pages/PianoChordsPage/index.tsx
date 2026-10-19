import {useMemo} from "react"
import {useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {Chord} from "tonal"
import {Segmented} from "@/components/ui/segmented"
import {CHORD_CATEGORIES, CHORD_TYPES, findChordType} from "@/constants/chordTypes"
import {POPULAR_CHORDS, POPULAR_TYPES} from "@/constants/popularChords"
import {getChordInfo, type ChordInfo} from "@/lib/theory/chords"
import {rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {SLASH_CHORD_TYPES} from "@/lib/theory/slash"
import type {ChordCategory, NoteName} from "@/types/music"
import {PageHeader} from "@/widgets/PageHeader"
import {matchesNote, NoteFilter, noteFilterParam, parseNoteFilter, type NoteFilterValue} from "@/widgets/NoteFilter"
import {RenderWhenNear} from "@/widgets/RenderWhenNear"
import {PianoChordCard} from "@/widgets/PianoChordCard"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {TermText} from "@/widgets/Term"

/** Same tabs as the guitar page, minus open chords, which only exist on a guitar. */
/** Rough height of a grid of `count` cards before it is built: two columns of ~320 px cards, a middle ground between phones and wide screens. */
function gridPlaceholder(count: number): number {
    return Math.ceil(count / 2) * 320
}

type ChordFilter = "popular" | ChordCategory | "slash"

const FILTERS: ChordFilter[] = ["popular", ...CHORD_CATEGORIES, "slash"]

const POPULAR_TYPE_FILTERS = ["all", ...POPULAR_TYPES] as const
type PopularTypeFilter = (typeof POPULAR_TYPE_FILTERS)[number]

interface ChordEntry {
    key: string
    chord: ChordInfo
    rank?: number
}

function popularEntries(): ChordEntry[] {
    return POPULAR_CHORDS.flatMap(item => {
        const chord = getChordInfo(item.root, item.type)
        return chord ? [{key: `popular-${item.rank}`, chord, rank: item.rank}] : []
    })
}

/** Every inversion of the common chord types on `root`: C/E, C/G, C7/B♭… */
function slashEntries(root: NoteName): ChordEntry[] {
    return SLASH_CHORD_TYPES.flatMap(type =>
        Chord.getChord(type, root).notes.slice(1, 4).flatMap(bass => {
            const chord = getChordInfo(root, type, bass)
            return chord ? [{key: `${root}-${type}-${bass}`, chord}] : []
        }),
    )
}

function categoryEntries(root: NoteName, category: ChordCategory): ChordEntry[] {
    return CHORD_TYPES
        .filter(type => type.category === category)
        .flatMap(type => {
            const chord = getChordInfo(root, type.symbol)
            return chord ? [{key: `${root}-${type.symbol}`, chord}] : []
        })
}

function ChordGrid({entries}: {entries: ChordEntry[]}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(entry => <PianoChordCard key={entry.key} chord={entry.chord} rank={entry.rank}/>)}
        </div>
    )
}

export default function PianoChordsPage() {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {t: tCommon} = useTranslation()
    const [params, setParams] = useSearchParams()

    const root = slugToRoot(params.get("root") ?? "") ?? "C"
    const filterParam = params.get("filter") as ChordFilter | null
    const filter: ChordFilter = filterParam && FILTERS.includes(filterParam) ? filterParam : "popular"
    const typeParam = params.get("type") as PopularTypeFilter | null
    const popularType: PopularTypeFilter = typeParam && POPULAR_TYPE_FILTERS.includes(typeParam) ? typeParam : "all"

    const allEntries = useMemo(
        () => (filter === "popular" ? popularEntries() : filter === "slash" ? slashEntries(root) : categoryEntries(root, filter)),
        [filter, root],
    )
    // The popular tab mixes every root, so it gets an "All + 12 notes" filter instead of the root picker.
    const note = filter === "popular" ? parseNoteFilter(params.get("note")) : "all"
    const entries = allEntries
        .filter(entry => matchesNote(entry.chord.root, note))
        .filter(entry => filter !== "popular" || popularType === "all" || entry.chord.type.symbol === popularType)
    // Popular tab: one section per chord type, in order of how common the type is.
    const popularGroups = filter === "popular"
        ? POPULAR_TYPES
            .map(type => ({type, items: entries.filter(entry => entry.chord.type.symbol === type)}))
            .filter(group => group.items.length > 0)
        : []

    const popularTypeLabel = (value: PopularTypeFilter) =>
        value === "all" ? t("mobility.filters.all") : value === "M" || value === "m" ? t(`chordTypes.${value}`) : (findChordType(value)?.suffix ?? value)

    const updateParams = (patch: {root?: NoteName; filter?: ChordFilter; type?: PopularTypeFilter; note?: NoteFilterValue}) => {
        const next = new URLSearchParams(params)
        if (patch.note) {
            const value = noteFilterParam(patch.note)
            if (value) next.set("note", value)
            else next.delete("note")
        }
        if (patch.type) {
            if (patch.type === "all") next.delete("type")
            else next.set("type", patch.type)
        }
        if (patch.root) next.set("root", rootToSlug(patch.root))
        if (patch.filter) next.set("filter", patch.filter)
        setParams(next, {replace: true})
    }

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.chords")} description={<TermText text={tPiano(`categoryDescriptions.${filter}`)}/>}/>

            <div className="space-y-5">
                <Segmented
                    label={tCommon("nav.chords")}
                    value={filter}
                    onChange={value => updateParams({filter: value})}
                    options={FILTERS.map(value => ({value, label: t(`chordCategories.${value}`)}))}
                />
                {filter === "popular" && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-base-500 uppercase">{t("popular.type")}</p>
                        <Segmented
                            label={t("popular.type")}
                            value={popularType}
                            onChange={value => updateParams({type: value})}
                            options={POPULAR_TYPE_FILTERS.map(value => ({value, label: popularTypeLabel(value)}))}
                        />
                    </div>
                )}
                {filter === "popular" && <NoteFilter value={note} onChange={value => updateParams({note: value})}/>}
                {filter !== "popular" && <RootNotePicker value={root} onChange={value => updateParams({root: value})}/>}
            </div>

            <div className="space-y-8">
                <div className="space-y-1 text-sm text-base-500">
                    <p>{t("chordCount", {count: entries.length})}</p>
                    <p>{tPiano("fingers.legend")}</p>
                </div>
                {/* With one note picked the list is short, so it shows as one grid instead of a section per type. */}
                {filter === "popular" && note === "all"
                    ? popularGroups.map(group => (
                        <section key={group.type} className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">
                                {t(`chordTypes.${group.type}`)}
                                <span className="ml-2 text-sm font-normal text-base-500">{group.items.length}</span>
                            </h2>
                            <RenderWhenNear placeholderHeight={gridPlaceholder(group.items.length)}>
                                <ChordGrid entries={group.items}/>
                            </RenderWhenNear>
                        </section>
                    ))
                    : <ChordGrid entries={entries}/>}
            </div>
        </div>
    )
}
