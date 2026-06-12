# UMORIA — the real Moria (1983) in a CRT shell

**English** · [Deutsch ↓](#deutsch)

> *The real Umoria roguelike, compiled to WebAssembly and wrapped in an authentic
> phosphor-CRT terminal — with an 80s chiptune soundtrack, narrator voice clips,
> multiple lives and a “speak-friend-and-enter” easter egg. Plays in any modern
> browser, no install.*

The **original Umoria** — the 1983 roguelike classic, complete and with **all**
its original mechanics — runs right here in the browser, embedded in an authentic
**phosphor-CRT screen** in the style of
[cool-retro-term](https://github.com/Swordfish90/cool-retro-term): scanlines,
tube curvature, phosphor persistence, glow, flicker and vignette. Plus a
live-generated **C64/SID chiptune soundtrack**, public-domain narrator voices and
an options menu.

▶ **Play now: https://dreaminodin.github.io/umoria/**

> ⚠️ **Note — built with “vibe-coding”.** This project was created by playful,
> AI-assisted coding (“vibe-coding”). I have **not read or reviewed every line of
> code** myself. If you use it, you do so **at your own risk** — without any
> warranty. Fittingly, the whole thing is under the GPL-3.0, which explicitly
> states “**ABSOLUTELY NO WARRANTY**”.

## Contents

- [What is this?](#what-is-this)
- [The history of Moria](#the-history-of-moria)
- [Play](#play)
- [Controls](#controls)
- [Personal extensions](#personal-extensions)
- [Music & voices](#music--voices)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Build from source](#build-from-source)
- [License & credits](#license--credits)

### What is this?

> **Design decision — not a remake, the original.** Early versions of this
> project were a hand-written JavaScript *remake*. But a remake can never match
> the original *exactly* — diagonal movement, item stats, the map, every monster,
> item and formula. So what runs here is the **real Umoria itself**: the
> unmodified C++ source (version 5.7.15 from
> [dungeons-of-moria/umoria](https://github.com/dungeons-of-moria/umoria)),
> compiled to WebAssembly/asm.js. My own code only adds the CRT look, the music
> and a few personal touches on top. The old remake is kept for reference under
> [legacy-remake/](legacy-remake/).

### The history of Moria

Moria is one of the founding fathers of the **roguelike** genre. It was created
by **Robert Alan Koeneke** at the **University of Oklahoma**: from late 1981 —
freshly hooked on *Rogue*, but stuck on a game-less VAX-11/780 running VMS — he
wrote his own dungeon adventure, first in **VMS BASIC** (*Moria Beta 1.0*), then
rewrote it in **VMS Pascal** in the summer of **1983** as **Moria 1.0**. He
borrowed its name and mood from the Mines of Moria in Tolkien’s *The Lord of the
Rings*.

**Jimmey Wayne Todd Jr.** joined in 1983/84, contributing the character
generation and the save/load code, among other things; later **Gary McAdoo**
co-developed it. Moria was the **first roguelike with a town level** and **one of
the earliest open-source games** (source released in 1986) — which is exactly what
made its many ports possible. **James E. Wilson** ported it to C for Unix from
1987 onward: **Umoria** (“Unix Moria”), the version this project is based on.
Moria directly inspired *Angband* and countless other roguelikes.

Its lovingly maintained history and source live on at the official site
**[umoria.org](https://umoria.org/)** and at
[dungeons-of-moria](https://github.com/dungeons-of-moria/umoria).

> **A heartfelt thank-you.** This little project is a bow to a game that pulled me
> down into the depths of the mines for hours on end in my youth. Thank you,
> **Robert Alan Koeneke** (who passed away in 2022, aged 64), for Moria — and
> thanks to everyone who has kept it alive for over four decades. May the Balrog
> wait at 2500 feet for a long time yet. 🕯️

### Play

Just **open `index.html` in a browser** — no build, no server needed. The engine
is fully embedded (WebAssembly single-file), save games live in the browser
(IndexedDB). Or play online: **https://dreaminodin.github.io/umoria/**

Goal: descend 50 levels (2500 feet) into the Mines of Moria and slay the
**Balrog**. It is the real game — character creation (races, classes, stats), a
town with shops and **haggling**, procedurally generated dungeons, traps, magic,
item identification and everything else that makes Umoria.

### Controls

The **original Umoria keys** apply. In game, press **`?`** for the full command
list and **`H`** for help/identity. Quick overview:

| Keys | Action |
|---|---|
| Digits `1`–`9` / numpad | Move in 8 directions — **including diagonals `7` `9` `1` `3`** |
| `>` / `<` | Stairs down / up |
| `i` · `e` · `w` · `t` | Inventory · equipment · wear/wield · take off |
| `q` · `r` · `E` | Quaff · read · eat |
| `m` / `p` | Cast / pray |
| `M` · `L` · `C` | Map · locate · character sheet |
| `R` · `s` · `T` | Rest · search · tunnel/door |

**Shell extras (these do not affect the game):**

| Key | Action |
|---|---|
| **F1** | Options menu (also via the gear icon, top right) |
| **F2** | Phosphor colour: amber / green / white |
| **F3** | Display: CRT (authentic) ↔ Sharp (modern, crisp) |
| **F4** | Music on/off |
| **F11** | Fullscreen (picture only) |

All settings are saved in the browser (localStorage). The options menu also has a
**dark/light mode** for dark or bright rooms and a toggle for the life colours.

### Personal extensions

Three wishes that are *game logic* were patched directly into the C++ source
(see [engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)):

- **Multiple lives (3).** A genuine death sends you back to town — gold and all
  items are gone, you keep only a dagger, a small shield, a few torches and some
  food. Level and experience persist. Only the third death is final (the original
  gravestone).
- **Per-life screen colour.** The status column shows “LIFE n”; the shell tints
  the screen **purple on life 2**, **red on life 3** (toggleable in the menu).
- **“mellon” easter egg.** A character named *mellon* (the inscription on the
  Doors of Durin — “speak, friend, and enter”) starts with **Sting** (an
  enchanted dagger) and a **Phial** (lantern).

Purely cosmetic wishes (CRT look, phosphor colours, dark/light, sharp/CRT,
fullscreen, chiptune, voices, menu) live in the shell and leave the game
untouched.

> **Saving & continuing:** press **`Ctrl-X`** in game to save and exit; your
> character — including the remaining lives — is stored in the browser
> (IndexedDB). An on-screen message then reminds you to **reload the page
> (Ctrl+F5)** to continue where you left off.

### Music & voices

- **C64/SID-style chiptune soundtrack**, generated live via WebAudio
  ([js/audio.js](js/audio.js)) — no audio files needed.
- **Narrator voices:** while descending (every 250-foot milestone) a ~45-second
  excerpt from `audio/voice/voice1.mp3 … voice8.mp3` plays, with the music ducking
  underneath. A public-domain **LibriVox reading of Beowulf** ships with it — the
  epic that inspired Tolkien. Drop your own (legally owned) Tolkien audiobook
  excerpts in as `voice2.mp3` etc. (Tolkien’s own recordings are copyrighted and
  not included.)

### How it works

```
 keyboard ──► Umoria engine (WASM)  ──writes──►  hidden DOM grid
                                                  (<div id="screen">)
                                                       │ read each frame
                                                       ▼
                       js/bridge.js ──► js/terminal.js ──► js/crt.js (WebGL)
                                                       │
                                                       ▼
                                                visible CRT canvas
```

- **Engine** — [engine/umoria.min.js](engine/umoria.min.js): the real Umoria
  5.7.15, compiled to WASM/asm.js from source (with the patches). It draws its
  80×24 text screen into hidden DOM rows.
- **Bridge** — [js/bridge.js](js/bridge.js): reads that character grid every frame
  and re-renders it through the **CRT shader**. Keystrokes go straight to the
  engine; only the F-keys are intercepted for the menu.
- **Renderer** — [js/terminal.js](js/terminal.js) (character terminal with
  phosphor palettes/themes) and [js/crt.js](js/crt.js) (WebGL: scanlines,
  curvature, phosphor persistence, glow, flicker, vignette).
- **Audio / settings** — [js/audio.js](js/audio.js), [js/settings.js](js/settings.js).

### Project structure

```
index.html               generated by build-index.js; loads engine + shell
build-index.js            generates index.html from engine/ + js/
engine/
  umoria.min.js           the compiled, patched engine (GPL-3.0)
  UMORIA-LICENSE,
  UMORIA-AUTHORS          engine license / authors
engine-patches/
  personal-mods.patch     our C++ source changes (against commit 89c4b54)
  build-engine.ps1        rebuilds the engine (Emscripten)
js/                       the shell: bridge, terminal, crt, audio, settings
audio/voice/              narrator clips (voice1.mp3 = public-domain Beowulf)
legacy-remake/            the old JavaScript remake (reference, unused)
test/render-test.html     headless test of the read→CRT render path
```

### Build from source

The finished `engine/umoria.min.js` is in the repo — no build is needed to
*play*. Only if you change the engine patches:

**Regenerate `index.html`** (after changes to the shell or engine):

```sh
node build-index.js
```

**Recompile the engine** (after changes to `personal-mods.patch`). Prerequisites
on PATH: the [Emscripten SDK](https://emscripten.org/) (`emsdk activate latest`),
`cmake`, `ninja` (e.g. `pip install cmake ninja`), `git` and `node`. Then:

```powershell
pwsh engine-patches/build-engine.ps1
```

The script clones the real Umoria browser source into `_engine/` (local,
git-ignored), applies `personal-mods.patch`, builds with Emscripten and writes the
result to `engine/umoria.min.js`.

### License & credits

Umoria is licensed under the **GNU General Public License v3.0**. Because the
engine is bundled and modified, the GPL-3.0 applies to this whole work —
including the shell, the CRT shader, the chiptune music and the bridge. Full
text: [LICENSE](LICENSE); engine authors: [engine/UMORIA-AUTHORS](engine/UMORIA-AUTHORS).
Our source changes are documented as a diff
([engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)).

- **Moria** (1983) — Robert Alan Koeneke · **Umoria** — James E. Wilson ·
  modernised by the [dungeons-of-moria](https://github.com/dungeons-of-moria/umoria) community
- Browser port (asm.js/WASM): [browser-based-umoria](https://github.com/jhirschberg70/browser-based-umoria) by J. Hirschberg
- CRT look inspired by [cool-retro-term](https://github.com/Swordfish90/cool-retro-term)
- Font [VT323](https://fonts.google.com/specimen/VT323) · Beowulf reading from [LibriVox](https://librivox.org/beowulf-by-unknown/) (public domain)

---

# Deutsch

[English ↑](#umoria--the-real-moria-1983-in-a-crt-shell)

Das **originale Umoria** — der Roguelike-Klassiker von 1983, vollständig und mit
**allen** Originalmechaniken — läuft hier direkt im Browser, eingebettet in einen
authentischen **Phosphor-CRT-Bildschirm** im Stil von
[cool-retro-term](https://github.com/Swordfish90/cool-retro-term): Scanlines,
Bildröhren-Wölbung, Nachleuchten, Glühen, Flackern und Vignette. Dazu ein live
erzeugter **C64/SID-Chiptune-Soundtrack**, gemeinfreie Erzähler-Stimmen und ein
Optionsmenü.

▶ **Jetzt spielen: https://dreaminodin.github.io/umoria/**

> ⚠️ **Hinweis — mit „Vibe-Coding“ erstellt.** Dieses Projekt ist beim
> spielerischen, KI-gestützten Drauflos-Programmieren („Vibe-Coding“) entstanden.
> Ich habe **nicht jede Zeile Code selbst gelesen oder geprüft**. Wer es benutzt,
> tut das **auf eigene Gefahr** — ohne jede Gewährleistung. Passend dazu steht das
> Ganze unter der GPL-3.0, die ausdrücklich „**ABSOLUTELY NO WARRANTY**“ vorsieht.

## Inhalt

- [Was ist das?](#was-ist-das)
- [Die Geschichte von Moria](#die-geschichte-von-moria)
- [Spielen](#spielen)
- [Steuerung](#steuerung)
- [Persönliche Erweiterungen](#persönliche-erweiterungen)
- [Musik & Stimmen](#musik--stimmen)
- [Wie es funktioniert](#wie-es-funktioniert)
- [Projektstruktur](#projektstruktur)
- [Selbst bauen](#selbst-bauen)
- [Lizenz & Credits](#lizenz--credits)

### Was ist das?

> **Designentscheidung — kein Remake, das Original.** Frühe Versionen dieses
> Projekts waren ein handgeschriebenes JavaScript-*Remake*. Ein Remake kann das
> Original aber nie *exakt* abbilden — Diagonalbewegung, Item-Werte, die Karte,
> jedes Monster, jeden Gegenstand, jede Formel. Deshalb läuft hier das **echte
> Umoria selbst**: der unveränderte C++-Quellcode (Version 5.7.15 aus
> [dungeons-of-moria/umoria](https://github.com/dungeons-of-moria/umoria)),
> kompiliert nach WebAssembly/asm.js. Mein eigener Code legt nur den CRT-Look, die
> Musik und ein paar persönliche Wünsche darüber. Das alte Remake liegt zur
> Referenz unter [legacy-remake/](legacy-remake/).

### Die Geschichte von Moria

Moria gehört zu den Urvätern des **Roguelike-Genres**. Geschaffen hat es **Robert
Alan Koeneke** an der **University of Oklahoma**: Ab Ende 1981 — frisch süchtig
nach *Rogue*, aber auf einem spiellosen VAX-11/780 unter VMS — schrieb er sein
eigenes Dungeon-Abenteuer, zuerst in **VMS BASIC** (*Moria Beta 1.0*), dann im
Sommer **1983** neu in **VMS Pascal** als **Moria 1.0**. Den Namen und die
Stimmung borgte er sich von den Minen von Moria aus Tolkiens *Der Herr der Ringe*.

**Jimmey Wayne Todd Jr.** stieß 1983/84 dazu und steuerte u. a. die
Charakter-Erschaffung und den Speicher-/Lade-Code bei; später entwickelte **Gary
McAdoo** mit. Moria war das **erste Roguelike mit einer Stadt-Ebene** und **eines
der ersten Open-Source-Spiele überhaupt** (Quellcode-Freigabe 1986) — genau das
machte seine vielen Portierungen erst möglich. **James E. Wilson** portierte es ab
1987 nach C für Unix: **Umoria** („Unix Moria“), die Fassung, auf der dieses
Projekt basiert. Moria inspirierte direkt *Angband* und unzählige weitere
Roguelikes.

Die liebevoll gepflegte Geschichte und der Quellcode leben weiter auf der
offiziellen Seite **[umoria.org](https://umoria.org/)** und bei
[dungeons-of-moria](https://github.com/dungeons-of-moria/umoria).

> **Danksagung.** Dieses kleine Projekt ist eine Verbeugung vor einem Spiel, das
> mich in meiner Jugend stundenlang in die Tiefen der Minen gezogen hat. Danke,
> **Robert Alan Koeneke** (verstorben 2022 im Alter von 64 Jahren), für Moria —
> und Dank an alle, die es über vier Jahrzehnte am Leben gehalten haben. Möge der
> Balrog noch lange auf 2500 Fuß warten. 🕯️

### Spielen

Einfach **`index.html` im Browser öffnen** — kein Build, kein Server nötig. Die
Engine ist vollständig eingebettet (WebAssembly als Single-File), Spielstände
liegen im Browser (IndexedDB). Oder direkt online:
**https://dreaminodin.github.io/umoria/**

Ziel: Steige 50 Ebenen (2500 Fuß) in die Minen von Moria hinab und erschlage den
**Balrog**. Es ist das echte Spiel — mit Charaktererschaffung (Rassen, Klassen,
Attribute), Stadt mit Läden samt **Feilschen**, prozeduralen Dungeons, Fallen,
Magie, Identifikation und allem, was Umoria ausmacht.

### Steuerung

Es gelten die **Original-Umoria-Tasten**. Im Spiel **`?`** für die vollständige
Befehlsliste, **`H`** für Hilfe/Identität. Kurzüberblick:

| Tasten | Aktion |
|---|---|
| Ziffern `1`–`9` / Numpad | Bewegung in 8 Richtungen — **inkl. Diagonalen `7` `9` `1` `3`** |
| `>` / `<` | Treppe hinab / hinauf |
| `i` · `e` · `w` · `t` | Inventar · Ausrüstung · anlegen · ablegen |
| `q` · `r` · `E` | Trank · Schriftrolle · essen |
| `m` / `p` | zaubern / beten |
| `M` · `L` · `C` | Karte · Position · Charakterbogen |
| `R` · `s` · `T` | rasten · suchen · Tür/graben |

**Zusatztasten der Hülle (greifen nicht ins Spiel ein):**

| Taste | Aktion |
|---|---|
| **F1** | Optionsmenü (auch per Zahnrad oben rechts) |
| **F2** | Phosphor-Farbe: Amber / Grün / Weiß |
| **F3** | Anzeige: CRT (authentisch) ↔ Sharp (modern, gestochen scharf) |
| **F4** | Musik an/aus |
| **F11** | Vollbild (nur das Bild) |

Alle Einstellungen werden im Browser gespeichert (localStorage). Im Optionsmenü
zusätzlich **Dark/Light-Modus** für dunkle bzw. helle Räume und ein Schalter für
die Leben-Farben.

### Persönliche Erweiterungen

Drei Wünsche, die *Spiellogik* sind, wurden direkt in den C++-Quellcode gepatcht
(siehe [engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)):

- **Mehrere Leben (3).** Ein echter Tod schickt dich zurück in die Stadt — Gold
  und alle Gegenstände sind weg, du behältst nur einen Dolch, einen kleinen
  Schild, ein paar Fackeln und etwas Proviant. Stufe und Erfahrung bleiben. Erst
  der dritte Tod ist endgültig (Original-Grabstein).
- **Bildschirmfarbe pro Leben.** Die Statusspalte zeigt „LIFE n“; die Hülle färbt
  den Schirm beim **2. Leben lila**, beim **3. Leben rot** (im Menü abschaltbar).
- **„mellon“-Easter-Egg.** Ein Charakter namens *mellon* (die Inschrift der Tore
  von Durin — „sprich Freund und tritt ein“) startet mit **Sting** (verzaubertem
  Dolch) und einer **Phiole** (Lampe).

Rein optische Wünsche (CRT-Look, Phosphor-Farben, Dark/Light, Sharp/CRT, Vollbild,
Chiptune, Stimmen, Menü) liegen in der Hülle und lassen das Spiel unangetastet.

> **Speichern & Fortsetzen:** Im Spiel **`Strg-X`** drücken zum Speichern und
> Beenden; dein Charakter — inklusive der verbleibenden Leben — liegt im Browser
> (IndexedDB). Eine Bildschirmmeldung erinnert dann ans **Neuladen der Seite
> (Strg+F5)**, um weiterzuspielen.

### Musik & Stimmen

- **Chiptune-Soundtrack im C64/SID-Stil**, live per WebAudio erzeugt
  ([js/audio.js](js/audio.js)) — keine Audiodateien nötig.
- **Erzähler-Stimmen:** Beim Abstieg (jede 250-Fuß-Marke) wird ein
  ~45-Sekunden-Ausschnitt aus `audio/voice/voice1.mp3 … voice8.mp3` eingespielt,
  die Musik duckt darunter weg. Mitgeliefert ist eine gemeinfreie
  **LibriVox-Lesung von Beowulf** — dem Epos, das Tolkien inspirierte. Eigene,
  legal besessene Tolkien-Hörbuch-Ausschnitte einfach als `voice2.mp3` usw.
  dazulegen (Tolkiens eigene Aufnahmen sind urheberrechtlich geschützt und nicht
  enthalten).

### Wie es funktioniert

```
 Tastatur ──► Umoria-Engine (WASM)  ──schreibt──►  verstecktes DOM-Raster
                                                    (<div id="screen">)
                                                         │ liest je Frame
                                                         ▼
                         js/bridge.js ──► js/terminal.js ──► js/crt.js (WebGL)
                                                         │
                                                         ▼
                                                  sichtbarer CRT-Canvas
```

- **Engine** — [engine/umoria.min.js](engine/umoria.min.js): das echte Umoria
  5.7.15, selbst aus dem Quellcode nach WASM/asm.js kompiliert (mit den Patches).
  Es zeichnet seinen 80×24-Textbildschirm in versteckte DOM-Zeilen.
- **Bridge** — [js/bridge.js](js/bridge.js): liest dieses Zeichenraster jeden
  Frame aus und rendert es über den **CRT-Shader** neu. Tastendrücke gehen direkt
  an die Engine; nur die F-Tasten fängt die Bridge für das Menü ab.
- **Renderer** — [js/terminal.js](js/terminal.js) (Zeichen-Terminal mit
  Phosphor-Paletten/Themes) und [js/crt.js](js/crt.js) (WebGL: Scanlines,
  Wölbung, Nachleucht-Persistenz, Glow, Flackern, Vignette).
- **Audio / Settings** — [js/audio.js](js/audio.js), [js/settings.js](js/settings.js).

### Projektstruktur

```
index.html               von build-index.js erzeugt; lädt Engine + Hülle
build-index.js            generiert index.html aus engine/ + js/
engine/
  umoria.min.js           die kompilierte, gepatchte Engine (GPL-3.0)
  UMORIA-LICENSE,
  UMORIA-AUTHORS          Lizenz/Autoren der Engine
engine-patches/
  personal-mods.patch     unsere C++-Quelländerungen (gegen Commit 89c4b54)
  build-engine.ps1        baut die Engine neu (Emscripten)
js/                       die Hülle: bridge, terminal, crt, audio, settings
audio/voice/              Erzähler-Clips (voice1.mp3 = gemeinfreier Beowulf)
legacy-remake/            das alte JavaScript-Remake (Referenz, ungenutzt)
test/render-test.html     headless-Test des Auslese→CRT-Render-Pfads
```

### Selbst bauen

Die fertige `engine/umoria.min.js` liegt im Repo — zum *Spielen* ist kein Build
nötig. Nur wenn du die Engine-Patches änderst:

**`index.html` neu erzeugen** (nach Änderungen an Hülle oder Engine):

```sh
node build-index.js
```

**Die Engine neu kompilieren** (nach Änderungen an `personal-mods.patch`).
Voraussetzungen auf dem PATH: das [Emscripten-SDK](https://emscripten.org/)
(`emsdk activate latest`), `cmake`, `ninja` (z. B. `pip install cmake ninja`),
`git` und `node`. Dann:

```powershell
pwsh engine-patches/build-engine.ps1
```

Das Script klont den echten Umoria-Browser-Quellcode nach `_engine/` (lokal,
git-ignoriert), wendet `personal-mods.patch` an, baut mit Emscripten und legt das
Ergebnis als `engine/umoria.min.js` ab.

### Lizenz & Credits

Umoria steht unter der **GNU General Public License v3.0**. Da die Engine
mitgeliefert und modifiziert wird, gilt die GPL-3.0 für dieses Gesamtwerk —
inklusive der Hülle, des CRT-Shaders, der Chiptune-Musik und der Bridge. Volltext:
[LICENSE](LICENSE); Engine-Autoren: [engine/UMORIA-AUTHORS](engine/UMORIA-AUTHORS).
Unsere Quelländerungen sind als Diff dokumentiert
([engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)).

- **Moria** (1983) — Robert Alan Koeneke · **Umoria** — James E. Wilson ·
  modernisiert von der [dungeons-of-moria](https://github.com/dungeons-of-moria/umoria)-Community
- Browser-Port (asm.js/WASM): [browser-based-umoria](https://github.com/jhirschberg70/browser-based-umoria) von J. Hirschberg
- CRT-Look inspiriert von [cool-retro-term](https://github.com/Swordfish90/cool-retro-term)
- Schrift [VT323](https://fonts.google.com/specimen/VT323) · Beowulf-Lesung von [LibriVox](https://librivox.org/beowulf-by-unknown/) (Public Domain)
