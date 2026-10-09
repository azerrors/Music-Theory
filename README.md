# Fretwise — Gitara nəzəriyyəsi

Akorların və qammaların quruluşunu interaktiv göstərən sayt: formul, notlar, qrif, barmaq düzülüşü və səs.

Ətraflı texniki tapşırıq: [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)

## Başlamaq

```bash
npm install
npm run dev
```

## Skriptlər

| Komanda | Nə edir |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Tip yoxlaması (`tsc -b`) + production build |
| `npm run typecheck` | Yalnız tip yoxlaması |
| `npm run lint` | ESLint |
| `npm test` | Vitest (watch) |
| `npm run test:run` | Vitest (bir dəfə) |

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · react-router · i18next · [tonal](https://github.com/tonaljs/tonal) · [Tone.js](https://tonejs.github.io/)
