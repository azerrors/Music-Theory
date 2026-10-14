# Fretwise — Texniki tapşırıq

> Versiya 0.1 · 2026-10-09 · Status: MVP skeleti hazırdır

## 1. Məqsəd

Gitaraçılar üçün interaktiv nəzəriyyə saytı. Sayt akorların və qammaların **necə qurulduğunu** göstərir: formul, notlar, qrifdəki yer, barmaq düzülüşü və səs. Əsas fikir əzbərlətmək deyil, anlatmaqdır.

## 2. Auditoriya

- Yeni başlayanlar: açıq akorlar, əsas triadalar
- Orta səviyyə: barre, septakkordlar, pentatonika, CAGED
- İrəli səviyyə: 9/11/13, modlar, harmonik və melodik minor

## 3. Əhatə dairəsi

### 3.1 MVP (bu versiyada var)

| Modul | Nə edir |
|---|---|
| **Akorlar kataloqu** | **Populyar 200** tabı (17 növ × 12 kök = 204 akor, mahnı korpuslarının statistikasına görə sıralanıb, hər birinin qrifdə ən azı 3 pozisiyası testlə yoxlanılır) + 8 kateqoriya: açıq, triada, sus, 6/add, 7-li, 9/11/13, power, slash. 33 akor növü × 12 kök not, 125 açıq akor + 33 açıq slash akor. Hər forma "sürüşən" (açıq simsiz) və ya "sabit" kimi işarələnir, yan paneldə izah və filtr var |
| **Akor səhifəsi** | Formul (1–♭3–5–♭7), notlar, bütün çalınma formaları (açıq + E-, A-, D-, C-, G-formaları, qrif boyunca sıralanıb və hər biri neçənci laddan başladığı ilə), sürüşən/sabit nişanı, qrifdə bütün akor notları, səs |
| **Proqressiyalar** | 3 addım: tonallıq (kök + major/minor) → 18 hazır proqressiya (kart şəklində, seçilmiş tonallıqda akor adları ilə) → akorlar. Akora klikləyəndə panel açılır: başqa akorla əvəz et, rəngini dəyiş, bas notunu dəyiş (slash), tonallıqdan kənar. Funksiya rəngləri (T/S/D), tonallığın akorları cədvəli, irəli səviyyə üçün yığılan "kənar akorlar" bölməsi |
| **Slash akorlar** | C/E, G/B, Am/G… Açıq formalar data kimi, çevirmələr hərəkətli şablon kimi (`slashVoicings.ts`), qalanları `withBass()` mövcud formaya bas əlavə edərək qurur. Akor səhifəsi `?bass=` parametrini qəbul edir və çevirməni izah edir |
| **Terminlər və lüğət** | 42 termin (AZ/EN/RU). Mətnlərdə `[[id|söz]]` kimi işarələnir və nöqtəli xətlə görünür: üzərinə gəldikdə və ya toxunduqda izah açılır, bəzilərində səs nümunəsi var. `/glossary` səhifəsində axtarış və qruplar var |
| **Mahnı analizi** | Akorları yazırsan (`G Em C D`, `Am | F | G/B`): sayt 24 tonallığı yoxlayıb ən uyğununu tapır, hər akorun pilləsini, funksiyasını və mənbəyini (tonallıqdan, harmonik minor, blues dominantı, ikinci dominant, eyniadlı laddan, kənar) göstərir, tanış proqressiyanı adlandırır. Transpozisiya və kapo hesablayıcı (açıq formaların sayına görə sıralanır) var. Bütün vəziyyət URL-dədir |
| **Akor qurucu** | Kök + 6 mərtəbə (tersiya/sus, kvinta, septima/6, 9, 11, 13). Akorun adı (kataloqla dəqiq interval və ya pitch-class uyğunluğu, kvintasız akorlar da tanınır), formul, notlar, səs, diaqram və qrif dərhal yenilənir. "Bu dəyişiklik nə etdi" izahı, əvvəlki akorla səs müqayisəsi, tersiyalar pilləkəni və 3 bələdçi turu var |
| **İntervallar** | Qrifdə istənilən nota klikləyəndə ±5 lad daxilində bütün intervallar (♭2…8) rəngli göstərilir. Cədvəldə ad, yarım ton, səslənmə, seçilmiş simdən barmaq formaları (G→B keçidi nəzərə alınır) və səs var |
| **Solo xəritəsi** | Proqressiyalar səhifəsində: tonallığın pentatonikası/tam qamması fonda, seçilmiş (və ya çalınan) akorun notları pillələri ilə üstdə, qammada olmayan akor notları ayrıca rəngdə |
| **Kvinta dairəsi** | Interaktiv SVG: 12 major + paralel minor. Seçilmiş tonallığın 6 əsas akoru rum rəqəmləri ilə işıqlanır; açar işarələri, notlar, akorlar, klaviatura ilə naviqasiya |
| **Qammalar** | 14 qamma: major, natural minor, pentatonikalar, blues, 7 mod, harmonik/melodik minor. Qrifdə göstərmə və pozisiyalar (pentatonika qutuları, 3 notes per string), səs, tonallıqdakı akorlar (I–vii°) |
| **Akor tanıyıcı** | Qrifdə notlara klikləyirsən, sayt akorun adını tapır |
| **Ayarlar** | C-D-E / Do-Re-Mi yazılışı, qrifdə not və ya pillə göstərmə, solaxay rejim, 5 köklənmə |
| **Dil** | AZ (əsas), EN, RU |
| **Mövzu** | Açıq / qaranlıq |

### 3.2 Mərhələ 2 (planlaşdırılır)

- [x] Tam CAGED: E-, A-, D-, C- və G-formaları
- [x] Qamma pozisiyaları: pentatonika qutuları (5), 3 notes-per-string (7), blues qutuları
- [x] İntervallar qrifdə
- [ ] Qulaq məşqi (sonraya saxlanılıb)
- [x] Kvinta dairəsi (interaktiv)
- [x] Akor proqressiyaları: I–V–vi–IV və s., tonallığa görə transpozisiya
- [ ] Real gitara sample-ları (hazırda Karplus-Strong sintezi işlənir)
- [ ] Alternativ köklənmələr üçün akor diaqramları
- [ ] Dərs məzmunu (məqalələr) və SEO üçün prerender

### 3.3 Hələlik əhatə olunmur

- Qeydiyyat və login, istifadəçi hesabları, irəliləyişin izlənməsi
- Backend (bütün data statikdir, hesablamalar brauzerdə aparılır)

## 4. Texniki arxitektura

| Qat | Seçim | Səbəb |
|---|---|---|
| Build | Vite 8 + React 19 + TypeScript (strict) | ERP layihəsi ilə eyni stack |
| Routing | react-router v8, səhifələr lazy yüklənir | |
| Stil | Tailwind CSS v4, `cva` + `cn` (shadcn üslubu) | |
| i18n | i18next + react-i18next, namespace-lər: `common`, `theory` | |
| Musiqi nəzəriyyəsi | **tonal** (`~6.4.2`) | Akor və qamma hesablamaları, akor tanıma. `6.5.0` versiyası npm-ə qırıq yayımlanıb (`dist/index.js` yoxdur), ona görə 6.4.x-ə bağlanıb |
| Səs | **Tone.js**, `PluckSynth` (Karplus-Strong) | İlk "Səsləndir" klikində lazy yüklənir (~80 kB gzip) |
| Diaqramlar | Öz SVG komponentlərimiz | Tam nəzarət: solaxay rejim, mövzu, etiketlər |
| Test | Vitest + Testing Library | |

### 4.1 Qovluq strukturu

```
src/
├── components/ui/      # Ümumi UI: button, card, badge, select, segmented, switch
├── constants/          # Statik data: notlar, akor növləri, qammalar, köklənmələr
│   └── voicings/       # Açıq akor formaları və hərəkətli E/A/D/C-forması şablonları
├── hooks/              # useSettings, useTheme, usePlayer
├── i18n/locales/       # AZ / EN / RU  ×  common.json, theory.json
├── layout/MainLayout/  # Header, naviqasiya, footer
├── lib/
│   ├── theory/         # Saf funksiyalar (React yoxdur): notes, chords, scales, voicings, slash, progressions, song, builder, intervals, solo, circle, positions, fretboard
│   └── audio/          # Tone.js qatı
├── pages/              # Hər route üçün bir qovluq (default export, lazy)
├── provider/           # SettingsProvider (localStorage-da saxlanılır)
├── router/             # paths, routes, error page
├── types/              # Domen tipləri (Voicing, ChordTypeDef, …)
└── widgets/            # Domen komponentləri: Fretboard, ChordDiagram, ChordCard, …
```

### 4.2 Əsas qaydalar

- **Nəzəriyyə məntiqi `lib/theory`-dədir və React-dan asılı deyil.** Komponentlər yalnız nəticəni göstərir.
- **Akor formaları data kimi saxlanılır.** Açıq akorlar `openVoicings.ts`-də, barre formaları `movableShapes.ts`-də şablon kimi yazılır. `placeShape()` şablonu istənilən kök nota sürüşdürür. `isMovableVoicing()` açıq simi olmayan formanı "sürüşən" sayır.
- **Hər forma testlə yoxlanılır.** `voicings.test.ts` hər açıq akorun və hər şablonun 12 tonallığın hamısında yalnız düzgün akor notlarını çaldığını yoxlayır. Formada səhv lad yazılsa, test yıxılır.
- **Sim indeksləri:** `0` = ən yoğun sim (6-cı, low E), `5` = ən nazik sim (1-ci, high e).
- **URL:** `#` URL-də xüsusi simvoldur, ona görə `C#` kökü URL-də `Cs` kimi yazılır (`/chords/Cs/m7`).
- **Kod şərhləri və test adları ingiliscədir, UI mətnləri i18n-dən gəlir.**
- **Terminlər:** i18n mətnində `[[termId|göstərilən söz]]` yazılır və `TermText` ilə render olunur. Atribut (`title`, `aria-label`) üçün `stripTerms()` işlədilir. `terms.test.ts` hər işarənin lüğətdə olduğunu və hər terminin 3 dildə tərcümə olunduğunu yoxlayır.
- **Terminologiya:** "paralel tonallıq" = C major ↔ A minor (notları eyni), "eyniadlı tonallıq" = C major ↔ C minor (Azərbaycan/rus ənənəsi).

### 4.3 Route-lar

| Yol | Səhifə |
|---|---|
| `/` | Ana səhifə |
| `/chords?filter=seventh&root=Bb&mobility=movable` | Akor kataloqu |
| `/chords/:root/:type` | Akor səhifəsi, məs. `/chords/A/m7`; slash akor: `/chords/D/M?bass=Fs` (D/F♯) |
| `/scales?root=A&scale=minorPentatonic` | Qammalar |
| `/progressions?key=A&mode=minor&preset=andalusian` | Proqressiyalar |
| `/fretboard` | Akor tanıyıcı |
| `/song?chords=A+E+F%23m+D&to=C` | Mahnı analizi |
| `/builder?root=A&i=3m,5P,7m` | Akor qurucu |
| `/intervals` | İntervallar |
| `/circle?key=D&mode=major` | Kvinta dairəsi |
| `/glossary#dominant` | Lüğət (hash termini işıqlandırır) |
| `/settings` | Ayarlar |

## 5. Açıq suallar

1. Domen adı və brend: "Fretwise" müvəqqəti addır.
2. Hosting: Vercel, Netlify və ya öz server (nginx + Docker, ERP-dəki kimi)?
3. Real gitara sample-ları lazımdırmı? Lazımdırsa, mənbə və lisenziya məsələsi həll olunmalıdır.
4. Dərs məzmununu kim yazacaq və hansı formatda (MDX)?
