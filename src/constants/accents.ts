/** Accent palettes, ordered by hue; the colours themselves live in index.css under html[data-accent]. */
export const ACCENTS = [
    {id: "ice", swatch: {light: "#3b6e86", dark: "#88c0d0"}},
    {id: "teal", swatch: {light: "#277e77", dark: "#36ada3"}},
    {id: "sage", swatch: {light: "#4b7c78", dark: "#6da7a1"}},
    {id: "jade", swatch: {light: "#3b8068", dark: "#50ad8e"}},
    {id: "emerald", swatch: {light: "#047857", dark: "#34d399"}},
    {id: "olive", swatch: {light: "#677b4a", dark: "#8ea66b"}},
    {id: "sky", swatch: {light: "#057ac0", dark: "#4bb8fa"}},
    {id: "blue", swatch: {light: "#0b76cc", dark: "#39a1f4"}},
    {id: "azure", swatch: {light: "#2971db", dark: "#6f9fe6"}},
    {id: "indigo", swatch: {light: "#4f46e5", dark: "#a5b4fc"}},
    {id: "orchid", swatch: {light: "#a942d3", dark: "#c681e2"}},
    {id: "rose", swatch: {light: "#be123c", dark: "#fb7185"}},
    {id: "coral", swatch: {light: "#cd440a", dark: "#f78d60"}},
    {id: "amber", swatch: {light: "#9b6c00", dark: "#f2a900"}},
] as const

export type AccentId = (typeof ACCENTS)[number]["id"]

export const DEFAULT_ACCENT: AccentId = "ice"
