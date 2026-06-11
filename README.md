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

- **Engine:** [engine/umoria.html](engine/umoria.html) ist das vorkompilierte
  echte Umoria. Es zeichnet seinen 80×24-Textbildschirm in versteckte
  DOM-Zeilen (`<div id="screen">`).
- **Hülle:** [js/bridge.js](js/bridge.js) liest dieses Zeichenraster Bild für
  Bild aus und zeichnet es über [js/terminal.js](js/terminal.js) +
  [js/crt.js](js/crt.js) (WebGL-CRT-Shader: Scanlines, Wölbung,
  Nachleuchten, Glow, Flackern, Vignette) neu. So bekommt das echte Spiel den
  Phosphor-Look. Tastatureingaben gehen direkt an die Engine.
- **Build:** `node build-index.js` erzeugt `index.html` neu aus
  `engine/umoria.html` + der Hülle (nützlich, wenn die Engine ausgetauscht wird).

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

## Status & geplante persönliche Wünsche

✅ **Phase 1 (fertig):** das echte, vollständige Umoria + CRT-Look + Phosphor-
Farben + Dark/Light + Sharp/CRT + Vollbild + Chiptune + Beowulf-Stimmen +
Optionsmenü.

🔜 **Phase 2 (geplant):** Damit auch die *gameplay-seitigen* Wünsche — **mehrere
Leben** (Tod → zurück in die Stadt, alles weg außer Dolch/Schild/Fackeln),
**Bildschirmfarbe pro Leben** (Leben 2 lila, Leben 3 rot) und das
**„mellon"-Easter-Egg** — exakt im Originalspiel funktionieren, muss der
C++-Quellcode der **neuesten** `dungeons-of-moria/umoria`-Version mit diesen
Patches neu nach WebAssembly kompiliert werden (Emscripten-Toolchain). Das ist
der nächste Schritt.

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
