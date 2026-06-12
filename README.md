# UMORIA — das echte Spiel im CRT-Look

> *The real Umoria (1983) roguelike, compiled to WebAssembly and wrapped in an
> authentic phosphor‑CRT terminal — with an 80s chiptune soundtrack, narrator
> voice clips, multiple lives and a “speak‑friend‑and‑enter” easter egg.
> Plays in any modern browser, no install.*

Das **originale Umoria** — der Roguelike‑Klassiker von 1983, vollständig und mit
**allen** Originalmechaniken — läuft hier direkt im Browser, eingebettet in einen
authentischen **Phosphor‑CRT‑Bildschirm** im Stil von
[cool‑retro‑term](https://github.com/Swordfish90/cool-retro-term): Scanlines,
Bildröhren‑Wölbung, Nachleuchten, Glühen, Flackern und Vignette. Dazu ein
live erzeugter **C64/SID‑Chiptune‑Soundtrack**, gemeinfreie Erzähler‑Stimmen
und ein Optionsmenü.

▶ **Jetzt spielen: https://dreaminodin.github.io/umoria/**

---

## Inhalt

- [Was ist das?](#was-ist-das)
- [Spielen](#spielen)
- [Steuerung](#steuerung)
- [Persönliche Erweiterungen](#persönliche-erweiterungen)
- [Musik & Stimmen](#musik--stimmen)
- [Wie es funktioniert](#wie-es-funktioniert)
- [Projektstruktur](#projektstruktur)
- [Selbst bauen](#selbst-bauen)
- [Lizenz & Credits](#lizenz--credits)

## Was ist das?

> **Designentscheidung — kein Remake, das Original.** Frühe Versionen dieses
> Projekts waren ein handgeschriebenes JavaScript‑*Remake*. Ein Remake kann das
> Original aber nie *exakt* abbilden — Diagonalbewegung, Item‑Werte, die Karte,
> jedes Monster, jeden Gegenstand, jede Formel. Deshalb läuft hier das **echte
> Umoria selbst**: der unveränderte C++‑Quellcode (Version 5.7.15 aus
> [dungeons‑of‑moria/umoria](https://github.com/dungeons-of-moria/umoria)),
> kompiliert nach WebAssembly/asm.js. Mein eigener Code legt nur den CRT‑Look,
> die Musik und ein paar persönliche Wünsche darüber. Das alte Remake liegt zur
> Referenz unter [legacy-remake/](legacy-remake/).

## Spielen

Einfach **`index.html` im Browser öffnen** — kein Build, kein Server nötig. Die
Engine ist vollständig eingebettet (WebAssembly als Single‑File), Spielstände
liegen im Browser (IndexedDB). Oder direkt online:
**https://dreaminodin.github.io/umoria/**

Ziel: Steige 50 Ebenen (2500 Fuß) in die Minen von Moria hinab und erschlage den
**Balrog**. Es ist das echte Spiel — mit Charaktererschaffung (Rassen, Klassen,
Attribute), Stadt mit Läden samt **Feilschen**, prozeduralen Dungeons, Fallen,
Magie, Identifikation und allem, was Umoria ausmacht.

## Steuerung

Es gelten die **Original‑Umoria‑Tasten**. Im Spiel **`?`** für die vollständige
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

### Zusatztasten der Hülle (greifen nicht ins Spiel ein)

| Taste | Aktion |
|---|---|
| **F1** | Optionsmenü (auch per Zahnrad oben rechts) |
| **F2** | Phosphor‑Farbe: Amber / Grün / Weiß |
| **F3** | Anzeige: CRT (authentisch) ↔ Sharp (modern, gestochen scharf) |
| **F4** | Musik an/aus |
| **F11** | Vollbild (nur das Bild) |

Alle Einstellungen werden im Browser gespeichert (localStorage). Im Optionsmenü
zusätzlich **Dark/Light‑Modus** für dunkle bzw. helle Räume und ein Schalter für
die Leben‑Farben.

## Persönliche Erweiterungen

Drei Wünsche, die *Spiellogik* sind, wurden direkt in den C++‑Quellcode gepatcht
(siehe [engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)):

- **Mehrere Leben (3).** Ein echter Tod schickt dich zurück in die Stadt — Gold
  und alle Gegenstände sind weg, du behältst nur einen Dolch, einen kleinen
  Schild, ein paar Fackeln und etwas Proviant. Stufe und Erfahrung bleiben. Erst
  der dritte Tod ist endgültig (Original‑Grabstein).
- **Bildschirmfarbe pro Leben.** Die Statusspalte zeigt „LIFE n“; die Hülle färbt
  den Schirm beim **2. Leben lila**, beim **3. Leben rot** (im Menü abschaltbar).
- **„mellon“‑Easter‑Egg.** Ein Charakter namens *mellon* (die Inschrift der Tore
  von Durin — „sprich Freund und tritt ein“) startet mit **Sting** (verzaubertem
  Dolch) und einer **Phiole** (Lampe).

Rein optische Wünsche (CRT‑Look, Phosphor‑Farben, Dark/Light, Sharp/CRT,
Vollbild, Chiptune, Stimmen, Menü) liegen in der Hülle und lassen das Spiel
unangetastet.

> Hinweis: Das Leben‑System wird (noch) nicht im Spielstand gespeichert — nach
> Speichern & Neuladen stehen wieder 3 Leben bereit.

## Musik & Stimmen

- **Chiptune‑Soundtrack im C64/SID‑Stil**, live per WebAudio erzeugt
  ([js/audio.js](js/audio.js)) — keine Audiodateien nötig.
- **Erzähler‑Stimmen:** Beim Abstieg (jede 250‑Fuß‑Marke) wird ein
  ~45‑Sekunden‑Ausschnitt aus `audio/voice/voice1.mp3 … voice8.mp3` eingespielt,
  die Musik duckt darunter weg. Mitgeliefert ist eine gemeinfreie
  **LibriVox‑Lesung von Beowulf** — dem Epos, das Tolkien inspirierte. Eigene,
  legal besessene Tolkien‑Hörbuch‑Ausschnitte einfach als `voice2.mp3` usw.
  dazulegen (Tolkiens eigene Aufnahmen sind urheberrechtlich geschützt und
  nicht enthalten).

## Wie es funktioniert

```
 Tastatur ──► Umoria‑Engine (WASM)  ──schreibt──►  verstecktes DOM‑Raster
                                                     (<div id="screen">)
                                                          │ liest je Frame
                                                          ▼
                          js/bridge.js ──► js/terminal.js ──► js/crt.js (WebGL)
                                                          │
                                                          ▼
                                                   sichtbarer CRT‑Canvas
```

- **Engine** — [engine/umoria.min.js](engine/umoria.min.js): das echte Umoria
  5.7.15, selbst aus dem Quellcode nach WASM/asm.js kompiliert (mit den Patches).
  Es zeichnet seinen 80×24‑Textbildschirm in versteckte DOM‑Zeilen.
- **Bridge** — [js/bridge.js](js/bridge.js): liest dieses Zeichenraster jeden
  Frame aus und rendert es über den **CRT‑Shader** neu. Tastendrücke gehen direkt
  an die Engine; nur die F‑Tasten fängt die Bridge für das Menü ab.
- **Renderer** — [js/terminal.js](js/terminal.js) (Zeichen‑Terminal mit
  Phosphor‑Paletten/Themes) und [js/crt.js](js/crt.js) (WebGL: Scanlines,
  Wölbung, Nachleucht‑Persistenz, Glow, Flackern, Vignette).
- **Audio / Settings** — [js/audio.js](js/audio.js), [js/settings.js](js/settings.js).

## Projektstruktur

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

## Selbst bauen

Die fertige `engine/umoria.min.js` liegt im Repo — zum *Spielen* ist kein Build
nötig. Nur wenn du die Engine‑Patches änderst:

**`index.html` neu erzeugen** (nach Änderungen an Hülle oder Engine):

```sh
node build-index.js
```

**Die Engine neu kompilieren** (nach Änderungen an `personal-mods.patch`).
Voraussetzungen auf dem PATH: das [Emscripten‑SDK](https://emscripten.org/)
(`emsdk activate latest`), `cmake`, `ninja` (z. B. `pip install cmake ninja`),
`git` und `node`. Dann:

```powershell
pwsh engine-patches/build-engine.ps1
```

Das Script klont den echten Umoria‑Browser‑Quellcode nach `_engine/` (lokal,
git‑ignoriert), wendet `personal-mods.patch` an, baut mit Emscripten und legt das
Ergebnis als `engine/umoria.min.js` ab.

## Lizenz & Credits

Umoria steht unter der **GNU General Public License v3.0**. Da die Engine
mitgeliefert und modifiziert wird, gilt die GPL‑3.0 für dieses Gesamtwerk —
inklusive der Hülle, des CRT‑Shaders, der Chiptune‑Musik und der Bridge.
Volltext: [LICENSE](LICENSE); Engine‑Autoren: [engine/UMORIA-AUTHORS](engine/UMORIA-AUTHORS).
Unsere Quelländerungen sind als Diff dokumentiert
([engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)).

- **Moria** (1983) — Robert A. Koeneke · **Umoria** — Jim E. Wilson · modernisiert
  von der [dungeons‑of‑moria](https://github.com/dungeons-of-moria/umoria)‑Community
- Browser‑Port (asm.js/WASM): [browser‑based‑umoria](https://github.com/jhirschberg70/browser-based-umoria) von J. Hirschberg
- CRT‑Look inspiriert von [cool‑retro‑term](https://github.com/Swordfish90/cool-retro-term)
- Schrift [VT323](https://fonts.google.com/specimen/VT323) · Beowulf‑Lesung von [LibriVox](https://librivox.org/beowulf-by-unknown/) (Public Domain)
