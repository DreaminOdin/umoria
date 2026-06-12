# UMORIA — das echte Spiel im CRT-Look

Das **originale Umoria** (aus [dungeons-of-moria/umoria](https://github.com/dungeons-of-moria/umoria))
— vollständig und mit allen Originalmechaniken — im Browser, eingebettet in
einen authentischen **Phosphor-CRT-Look** im Stil von
[cool-retro-term](https://github.com/Swordfish90/cool-retro-term), mit
80er-Chiptune-Soundtrack, Erzähler-Stimmen und einem Optionsmenü.

> **Wichtige Designentscheidung:** Frühere Versionen dieses Projekts waren ein
> handgeschriebenes JavaScript-*Remake*. Ein Remake kann das Original nie
> *exakt* abbilden — Diagonalbewegung, Item-Specs, die Karte, alle Monster,
> Items, Formeln und Mechaniken. Deshalb läuft jetzt das **echte Umoria selbst**
> (als WebAssembly/asm.js, kompiliert aus dem Originalquellcode), und mein Code
> legt nur den Look, die Musik und meine persönlichen Wünsche darüber. Das alte
> Remake liegt zur Referenz unter [legacy-remake/](legacy-remake/).

## Starten

`index.html` im Browser öffnen — kein Build, kein Server nötig (die Engine ist
vollständig in die Datei eingebettet; Spielstände liegen in IndexedDB).
Online: **https://dreaminodin.github.io/umoria/**

## Wie es funktioniert

- **Engine:** [engine/umoria.min.js](engine/umoria.min.js) ist das echte
  Umoria **5.7.15**, von mir selbst aus dem Originalquellcode nach
  WebAssembly/asm.js kompiliert — **mit meinen Patches** (siehe unten). Es
  zeichnet seinen 80×24-Textbildschirm in versteckte DOM-Zeilen
  (`<div id="screen">`).
- **Hülle:** [js/bridge.js](js/bridge.js) liest dieses Zeichenraster Bild für
  Bild aus und zeichnet es über [js/terminal.js](js/terminal.js) +
  [js/crt.js](js/crt.js) (WebGL-CRT-Shader: Scanlines, Wölbung,
  Nachleuchten, Glow, Flackern, Vignette) neu. So bekommt das echte Spiel den
  Phosphor-Look. Tastatureingaben gehen direkt an die Engine.
- **Build:** `node build-index.js` erzeugt `index.html` aus
  `engine/umoria.min.js` + der Hülle. Die Engine selbst wird mit
  [_tools/build-umoria.ps1](_tools/build-umoria.ps1) (Emscripten + CMake +
  Ninja) gebaut; meine Quelländerungen liegen als Diff in
  [engine-patches/personal-mods.patch](engine-patches/personal-mods.patch)
  (gegen `dungeons-of-moria/umoria`-Port-Commit `89c4b54`).

## Steuerung

Es ist das **echte Umoria** — es gelten die Originaltasten. Im Spiel
**`?` drücken für die vollständige Befehlsliste**, `H` für die Hilfe/Identität.
Kurzüberblick:

- **Bewegung:** Ziffern `1`–`9` wie auf dem Numpad — **inklusive Diagonalen
  `7` `9` `1` `3`**. (Im Original auch `hjkl`/`yubn` im Rogue-like-Modus.)
- `>` / `<` Treppe hinab/hinauf · `R` rasten · `s` suchen · `T` Tür/Graben
- `i` Inventar · `e` Ausrüstung · `w` anlegen · `t` ablegen
- `q` trinken · `r` lesen · `E` essen · `m`/`p` zaubern/beten
- `M` Karte der Ebene · `L` Position · `C` Charakterbogen
- In Läden: kaufen/verkaufen **mit Feilschen** (alles original)

### Meine Zusatztasten (greifen nicht ins Spiel ein)

| Taste | Aktion |
|---|---|
| **F1** | Optionsmenü (auch per Zahnrad-Symbol oben rechts) |
| **F2** | Phosphor-Farbe (Amber / Grün / Weiß) |
| **F3** | Anzeige: CRT (authentisch) ↔ Sharp (modern, gestochen scharf) |
| **F4** | Musik an/aus |
| **F11** | Vollbild (nur das Bild) |

Die Einstellungen werden im Browser gespeichert (localStorage). Im Optionsmenü
zusätzlich: **Dark/Light-Modus** für dunkle bzw. helle Räume.

## Musik & Stimmen

- **Chiptune-Soundtrack im C64/SID-Stil**, live per WebAudio erzeugt
  ([js/audio.js](js/audio.js)).
- **Erzähler-Stimmen:** Beim Abstieg (jede 250-Fuß-Marke) wird ein
  ~45-Sekunden-Ausschnitt aus `audio/voice/voice1.mp3` … `voice8.mp3`
  eingespielt, die Musik duckt darunter weg. Mitgeliefert ist eine gemeinfreie
  **LibriVox-Lesung von Beowulf** — das Epos, das Tolkien inspirierte. Eigene
  (legal besessene) Tolkien-Hörbuch-Ausschnitte einfach als `voice2.mp3` usw.
  dazulegen.

## Persönliche Wünsche (alle umgesetzt)

✅ Echtes, vollständiges Umoria 5.7.15 + CRT-Look + Phosphor-Farben +
Dark/Light + Sharp/CRT + Vollbild + Chiptune + Beowulf-Stimmen + Optionsmenü.

✅ **Mehrere Leben** (3 Leben): Ein echter Tod schickt dich zurück in die
Stadt — Gold und alle Gegenstände sind weg, du behältst nur einen Dolch, einen
kleinen Schild, ein paar Fackeln und etwas Proviant. Stufe und Erfahrung
bleiben. Erst der dritte Tod ist endgültig (Original-Grabstein). *Direkt im
C++-Quellcode der Engine eingebaut* (`game_run.cpp`), nicht in der Hülle.

✅ **Bildschirmfarbe pro Leben:** Die Statusspalte zeigt „LIFE n"; die Hülle
färbt den Schirm beim 2. Leben **lila**, beim 3. Leben **rot** (im Menü
abschaltbar).

✅ **„mellon"-Easter-Egg:** Ein Charakter namens *mellon* (Inschrift der Tore
von Durin) startet mit **Sting** (verzaubertem Dolch) und einer **Phiole**
(Lampe). *Im Quellcode eingebaut.*

## Lizenz & Credits

Umoria steht unter der **GNU General Public License v3.0**; da die Engine
mitgeliefert wird, gilt das auch für dieses Gesamtwerk. Siehe
[engine/UMORIA-LICENSE](engine/UMORIA-LICENSE) und
[engine/UMORIA-AUTHORS](engine/UMORIA-AUTHORS).

- **Moria** (1983) — Robert A. Koeneke; **Umoria** — Jim E. Wilson;
  modernisiert von der [dungeons-of-moria](https://github.com/dungeons-of-moria/umoria)-Community
- Browser-Port (asm.js/WASM): [browser-based-umoria](https://github.com/jhirschberg70/browser-based-umoria) von J. Hirschberg
- CRT-Look inspiriert von [cool-retro-term](https://github.com/Swordfish90/cool-retro-term)
- Schrift [VT323](https://fonts.google.com/specimen/VT323) · Beowulf-Lesung [LibriVox](https://librivox.org/beowulf-by-unknown/) (Public Domain)
- CRT-Shader, Chiptune, Bridge und Menü: dieses Projekt (GPL-3.0)
