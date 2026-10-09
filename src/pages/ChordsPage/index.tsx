import {useMemo} from "react"
import {useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {Segmented} from "@/components/ui/segmented"
import {CHORD_CATEGORIES, CHORD_TYPES, findChordType} from "@/constants/chordTypes"
import {OPEN_VOICINGS} from "@/constants/voicings/openVoicings"
import {OPEN_SLASH_VOICINGS} from "@/constants/voicings/slashVoicings"
import {getChordInfo, type ChordInfo} from "@/lib/theory/chords"
import {rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {inversionBasses, SLASH_CHORD_TYPES, slashVoicings} from "@/lib/theory/slash"
import {getVoicings, isMovableVoicing} from "@/lib/theory/voicings"
import type {ChordCategory, NoteName, Voicing} from "@/types/music"
import {ChordCard} from "@/widgets/ChordCard"
import {MOBILITY_FILTERS, MobilityPanel, type MobilityFilter} from "@/widgets/MobilityPanel"
import {PageHeader} from "@/widgets/PageHeader"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {TermText} from "@/widgets/Term"

type ChordFilter = "open" | ChordCategory | "slash"

const FILTERS: ChordFilter[] = ["open", ...CHORD_CATEGORIES, "slash"]

/** Group headings of the open tab: the catalogue categories plus slash chords. */
type OpenGroup = ChordCategory | "slash"

interface ChordEntry {
    key: string
    chord: ChordInfo
    voicing?: Voicing
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
            {entries.map(entry => <ChordCard key={entry.key} chord={entry.chord} voicing={entry.voicing}/>)}
        </div>
    )
}

export default function ChordsPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const [params, setParams] = useSearchParams()

    const root = slugToRoot(params.get("root") ?? "") ?? "C"
    const filterParam = params.get("filter") as ChordFilter | null
    const filter: ChordFilter = filterParam && FILTERS.includes(filterParam) ? filterParam : "open"
    const mobilityParam = params.get("mobility") as MobilityFilter | null
    const mobility: MobilityFilter = mobilityParam && MOBILITY_FILTERS.includes(mobilityParam) ? mobilityParam : "all"

    const allEntries = useMemo(
        () => (filter === "open"
            ? [...openChordEntries(), ...openSlashEntries()]
            : filter === "slash" ? slashEntries(root) : categoryEntries(root, filter)),
        [filter, root],
    )
    const entries = allEntries.filter(entry => matchesMobility(entry, mobility))
    const movableCount = allEntries.filter(entry => matchesMobility(entry, "movable")).length

    // The open tab is long, so it is split into the same groups as the other tabs.
    const groupOf = (entry: ChordEntry): OpenGroup => (entry.chord.bass ? "slash" : findChordType(entry.chord.type.symbol)?.category ?? "triad")
    const openGroups = filter === "open"
        ? ([...CHORD_CATEGORIES, "slash"] as OpenGroup[])
            .map(category => ({category, items: entries.filter(entry => groupOf(entry) === category)}))
            .filter(group => group.items.length > 0)
        : []

    const updateParams = (patch: {root?: NoteName; filter?: ChordFilter; mobility?: MobilityFilter}) => {
        const next = new URLSearchParams(params)
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
                {filter !== "open" && <RootNotePicker value={root} onChange={value => updateParams({root: value})}/>}
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_18rem]">
                <div className="min-w-0 space-y-8">
                    <p className="text-sm text-stone-500">{t("chordCount", {count: entries.length})}</p>

                    {entries.length === 0 && <p className="text-sm text-stone-500">{t("mobility.empty")}</p>}

                    {filter === "open"
                        ? openGroups.map(group => (
                            <section key={group.category} className="space-y-4">
                                <h2 className="text-lg font-semibold tracking-tight">
                                    {t(`chordCategories.${group.category}`)}
                                    <span className="ml-2 text-sm font-normal text-stone-500">{group.items.length}</span>
                                </h2>
                                <ChordGrid entries={group.items}/>
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
