import {useMemo} from "react"
import {useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {Segmented} from "@/components/ui/segmented"
import {CHORD_CATEGORIES, CHORD_TYPES, findChordType} from "@/constants/chordTypes"
import {POPULAR_CHORDS, POPULAR_TYPES} from "@/constants/popularChords"
import {OPEN_VOICINGS} from "@/constants/voicings/openVoicings"
import {OPEN_SLASH_VOICINGS} from "@/constants/voicings/slashVoicings"
import {getChordInfo, type ChordInfo} from "@/lib/theory/chords"
import {rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {inversionBasses, SLASH_CHORD_TYPES, slashVoicings} from "@/lib/theory/slash"
import {getVoicings, isMovableVoicing, primaryVoicing} from "@/lib/theory/voicings"
import type {ChordCategory, NoteName, Voicing} from "@/types/music"
import {ChordCard} from "@/widgets/ChordCard"
import {MOBILITY_FILTERS, MobilityPanel, type MobilityFilter} from "@/widgets/MobilityPanel"
import {PageHeader} from "@/widgets/PageHeader"
import {RenderWhenNear} from "@/widgets/RenderWhenNear"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {TermText} from "@/widgets/Term"

/** Rough height of a grid of `count` cards before it is built: two columns of ~300 px cards, a middle ground between phones and wide screens. */
function gridPlaceholder(count: number): number {
    return Math.ceil(count / 2) * 300
}

type ChordFilter = "popular" | "open" | ChordCategory | "slash"

const FILTERS: ChordFilter[] = ["popular", "open", ...CHORD_CATEGORIES, "slash"]

const POPULAR_TYPE_FILTERS = ["all", ...POPULAR_TYPES] as const
type PopularTypeFilter = (typeof POPULAR_TYPE_FILTERS)[number]

/** Group headings of the open tab: the catalogue categories plus slash chords. */
type OpenGroup = ChordCategory | "slash"

interface ChordEntry {
    key: string
    chord: ChordInfo
    voicing?: Voicing
    /** Popular tab: rank among the most used chords and how many shapes it has on the neck. */
    rank?: number
    shapeCount?: number
}

/** The ~200 most used chords, each with the shape a chord chart would show first. */
function popularEntries(): ChordEntry[] {
    return POPULAR_CHORDS.flatMap(item => {
        const chord = getChordInfo(item.root, item.type)
        if (!chord) return []
        const voicings = getVoicings(item.root, item.type)
        return [{key: `popular-${item.rank}`, chord, voicing: primaryVoicing(voicings), rank: item.rank, shapeCount: voicings.length}]
    })
}

function openChordEntries(): ChordEntry[] {
    return OPEN_VOICINGS.flatMap((def, index) => {
        const chord = getChordInfo(def.root, def.type)
        if (!chord) return []
        const id = `open-${def.root}${def.type}-${index}`
        return [{key: id, chord, voicing: {id, shape: "open", frets: def.frets, fingers: def.fingers, barre: def.barre}}]
    })
}

function openSlashEntries(): ChordEntry[] {
    return OPEN_SLASH_VOICINGS.flatMap((def, index) => {
        const chord = getChordInfo(def.root, def.type, def.bass)
        if (!chord) return []
        const id = `open-slash-${index}`
        return [{key: id, chord, voicing: {id, shape: "open", frets: def.frets, fingers: def.fingers, barre: def.barre}}]
    })
}

/** Every inversion of the common chord types on `root`: C/E, C/G, Cm/E♭, C7/B♭… */
function slashEntries(root: NoteName): ChordEntry[] {
    return SLASH_CHORD_TYPES.flatMap(type =>
        inversionBasses(root, type).flatMap(bass => {
            const chord = getChordInfo(root, type, bass)
            if (!chord) return []
            return [{key: `${root}-${type}-${bass}`, chord, voicing: slashVoicings(root, type, bass)[0]}]
        }),
    )
}

function categoryEntries(root: NoteName, category: ChordCategory): ChordEntry[] {
    return CHORD_TYPES
        .filter(type => type.category === category)
        .flatMap(type => {
            const chord = getChordInfo(root, type.symbol)
            if (!chord) return []
            // Prefer a barre shape here; open shapes have their own tab.
            const voicings = getVoicings(root, type.symbol)
            return [{key: `${root}-${type.symbol}`, chord, voicing: voicings.find(voicing => voicing.shape !== "open") ?? voicings[0]}]
        })
}

function matchesMobility(entry: ChordEntry, mobility: MobilityFilter): boolean {
    if (mobility === "all" || !entry.voicing) return true
    return isMovableVoicing(entry.voicing) === (mobility === "movable")
}

function ChordGrid({entries}: {entries: ChordEntry[]}) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {entries.map(entry => <ChordCard key={entry.key} chord={entry.chord} voicing={entry.voicing} rank={entry.rank} shapeCount={entry.shapeCount}/>)}
        </div>
    )
}

export default function ChordsPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const [params, setParams] = useSearchParams()

    const root = slugToRoot(params.get("root") ?? "") ?? "C"
    const filterParam = params.get("filter") as ChordFilter | null
    const filter: ChordFilter = filterParam && FILTERS.includes(filterParam) ? filterParam : "popular"
    const mobilityParam = params.get("mobility") as MobilityFilter | null
    const mobility: MobilityFilter = mobilityParam && MOBILITY_FILTERS.includes(mobilityParam) ? mobilityParam : "all"

    const allEntries = useMemo(
        () => (filter === "popular"
            ? popularEntries()
            : filter === "open"
                ? [...openChordEntries(), ...openSlashEntries()]
                : filter === "slash" ? slashEntries(root) : categoryEntries(root, filter)),
        [filter, root],
    )
    const typeParam = params.get("type") as PopularTypeFilter | null
    const popularType: PopularTypeFilter = typeParam && POPULAR_TYPE_FILTERS.includes(typeParam) ? typeParam : "all"
    const entries = allEntries
        .filter(entry => matchesMobility(entry, mobility))
        .filter(entry => filter !== "popular" || popularType === "all" || entry.chord.type.symbol === popularType)
    // Popular tab: one section per chord type, in order of how common the type is.
    const popularGroups = filter === "popular"
        ? POPULAR_TYPES
            .map(type => ({type, items: entries.filter(entry => entry.chord.type.symbol === type)}))
            .filter(group => group.items.length > 0)
        : []
    const movableCount = allEntries.filter(entry => matchesMobility(entry, "movable")).length

    // The open tab is long, so it is split into the same groups as the other tabs.
    const groupOf = (entry: ChordEntry): OpenGroup => (entry.chord.bass ? "slash" : findChordType(entry.chord.type.symbol)?.category ?? "triad")
    const openGroups = filter === "open"
        ? ([...CHORD_CATEGORIES, "slash"] as OpenGroup[])
            .map(category => ({category, items: entries.filter(entry => groupOf(entry) === category)}))
            .filter(group => group.items.length > 0)
        : []

    const popularTypeLabel = (value: PopularTypeFilter) =>
        value === "all" ? t("mobility.filters.all") : value === "M" || value === "m" ? t(`chordTypes.${value}`) : (findChordType(value)?.suffix ?? value)

    const updateParams = (patch: {root?: NoteName; filter?: ChordFilter; mobility?: MobilityFilter; type?: PopularTypeFilter}) => {
        const next = new URLSearchParams(params)
        if (patch.type) {
            if (patch.type === "all") next.delete("type")
            else next.set("type", patch.type)
        }
        if (patch.root) next.set("root", rootToSlug(patch.root))
        if (patch.filter) next.set("filter", patch.filter)
        if (patch.mobility) {
            if (patch.mobility === "all") next.delete("mobility")
            else next.set("mobility", patch.mobility)
        }
        setParams(next, {replace: true})
    }

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.chords")} description={<TermText text={t(`chordCategoryDescriptions.${filter}`)}/>}/>

            <div className="space-y-5">
                <Segmented
                    label={tCommon("nav.chords")}
                    value={filter}
                    onChange={value => updateParams({filter: value})}
                    options={FILTERS.map(value => ({value, label: t(`chordCategories.${value}`)}))}
                />
                {filter === "popular" && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{t("popular.type")}</p>
                        <Segmented
                            label={t("popular.type")}
                            value={popularType}
                            onChange={value => updateParams({type: value})}
                            options={POPULAR_TYPE_FILTERS.map(value => ({value, label: popularTypeLabel(value)}))}
                        />
                    </div>
                )}
                {filter !== "open" && filter !== "popular" && <RootNotePicker value={root} onChange={value => updateParams({root: value})}/>}
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_18rem]">
                <div className="min-w-0 space-y-8">
                    <p className="text-sm text-stone-500">{t("chordCount", {count: entries.length})}</p>

                    {entries.length === 0 && <p className="text-sm text-stone-500">{t("mobility.empty")}</p>}

                    {filter === "popular" && popularGroups.map(group => (
                        <section key={group.type} className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">
                                {t(`chordTypes.${group.type}`)}
                                <span className="ml-2 text-sm font-normal text-stone-500">{group.items.length}</span>
                            </h2>
                            <RenderWhenNear placeholderHeight={gridPlaceholder(group.items.length)}>
                                <ChordGrid entries={group.items}/>
                            </RenderWhenNear>
                        </section>
                    ))}
                    {filter === "popular" ? null : filter === "open"
                        ? openGroups.map(group => (
                            <section key={group.category} className="space-y-4">
                                <h2 className="text-lg font-semibold tracking-tight">
                                    {t(`chordCategories.${group.category}`)}
                                    <span className="ml-2 text-sm font-normal text-stone-500">{group.items.length}</span>
                                </h2>
                                <RenderWhenNear placeholderHeight={gridPlaceholder(group.items.length)}>
                                    <ChordGrid entries={group.items}/>
                                </RenderWhenNear>
                            </section>
                        ))
                        : <ChordGrid entries={entries}/>}
                </div>

                <aside className="order-first lg:order-last">
                    <MobilityPanel
                        movableCount={movableCount}
                        fixedCount={allEntries.length - movableCount}
                        filter={mobility}
                        onFilterChange={value => updateParams({mobility: value})}
                    />
                </aside>
            </div>
        </div>
    )
}
