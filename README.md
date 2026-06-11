# UMORIA — The Dungeons of Moria (Browser-Remake)

Ein Remake des Roguelike-Klassikers **Moria (1983)** von Robert A. Koeneke
(bzw. Umoria von Jim E. Wilson) — komplett im Browser, mit authentischem
**Phosphor-CRT-Look** im Stil von
[cool-retro-term](https://github.com/Swordfish90/cool-retro-term):
Scanlines, Bildschirmwölbung, Nachleuchten (Ghosting), Glow, Flackern,
Rauschen und Rolling Bar — als WebGL-Shader.

![Genre](https://img.shields.io/badge/genre-roguelike-orange)
![Tech](https://img.shields.io/badge/tech-vanilla%20JS%20%2B%20WebGL-blue)

## Starten

Einfach **`index.html` im Browser öffnen** — kein Build, kein Server nötig.
(Optional: `npx serve` für einen lokalen Webserver.)

## Das Spiel

- **Ziel:** Steige 50 Ebenen (2500 Fuß) hinab und erschlage den **Balrog**.
- **Charaktererschaffung** wie im Original: 8 Rassen, 4 Klassen (Warrior,
  Mage, Priest, Rogue), ausgewürfelte Attribute.
- **Stadt** mit 6 Läden (betreten durch die nummerierten Türen `1`–`6`):
  Gemischtwaren, Rüstungen, Waffen, Tempel, Alchemist, Magier.
- **Dungeon:** prozedural generierte Ebenen, Fallen, Geheimnisse, über 35
  Monsterarten (Gift, Paralyse, Lebenskraft-Entzug, Diebe, Zauberer,
  Drachenodem …).
- **Licht ist Leben:** Fackeln brennen ab, Laternen brauchen Öl. Ohne Licht
  siehst du in dunklen Gängen nichts.
- **Hunger:** Iss, oder du verhungerst.
- **Unidentifizierte Tränke & Schriftrollen** („Crimson Potion …was das wohl
  ist?").
- **Magie** für Mage und Priest (Magic Missile, Frost Bolt, Heilung, …).

### Mehrere Leben

Du hast **3 Leben**. Stirbst du, schleppen dich Tempel-Akolythen zurück zum
Stadtplatz: **alles Gold und alle Gegenstände sind weg** — du behältst nur
einen Dolch, einen kleinen Schild, ein paar Fackeln und etwas Proviant.
Stufe und Erfahrung bleiben erhalten. Erst der dritte Tod ist endgültig —
dann gibt's den klassischen Grabstein.

Standardmäßig wechselt dabei die Bildschirmfarbe: zweites Leben **Purple**,
drittes Leben **Rot** — man sieht also jederzeit, wie ernst es steht
(im Optionsmenü abschaltbar).

## Steuerung

Standard ist die **originale Umoria-Tastaturbelegung**; im Optionsmenü kann
auf Rogue-like-Tasten (`hjkl`) umgeschaltet werden. `?` zeigt jederzeit die
vollständige Befehlsliste der aktiven Belegung (auch auf dem Titelbildschirm).

| Taste | Aktion |
|---|---|
| Pfeile / Numpad `1`–`9` | Bewegen (8 Richtungen); `hjkl`/`yubn` im Rogue-like-Modus |
| `5` oder `.` | Warten |
| `>` / `<` | Treppe runter / rauf |
| `M` | **Karte der Ebene** |
| `L` | Position anzeigen (locate) |
| `l` | Umsehen (look; im Rogue-like-Modus: `x`) |
| `C` | Charakterbogen |
| `o` / `c` | Tür öffnen / schließen (mit Richtung) |
| `g` oder `,` | Aufheben |
| `i` / `e` | Inventar / Ausrüstungsliste |
| `w` / `t` | Anlegen / Ablegen |
| `q` / `r` / `E` | Trank trinken / Schriftrolle lesen / Essen |
| `F` | Laterne mit Öl füllen |
| `m` / `p` | Zauber wirken (Mage) / Beten (Priest) |
| `R` | Rasten |
| `s` | Nach Fallen suchen |
| `d` | Gegenstand fallen lassen |
| `?` | Hilfe mit allen Tasten |
| **ESC** oder `=` | **Optionsmenü** |
| **Leertaste** | Menüs, Läden und Listen schließen (wichtig im Vollbild!) |
| **F2** | Phosphor-Farbe (Amber / Grün / Weiß) |
| **F3** | Anzeige: CRT (authentisch) / Sharp (modern) |
| **F4** | Musik an/aus |
| **F11** | Vollbild (nur das Bild, ohne Rahmen) |

## Optionsmenü (ESC)

Alle Einstellungen werden im Browser gespeichert (localStorage):

- **Display:** *CRT (authentic 1983)* — die volle Röhren-Optik — oder
  *Sharp (modern)*: doppelte Render-Auflösung, gestochen scharf, ohne
  CRT-Effekte.
- **Phosphor colour:** Amber / Grün / Weiß.
- **Screen colour per life:** Bildschirmfarbe wechselt mit jedem Leben —
  Leben 1 normal, Leben 2 **Purple**, Leben 3 **Rot**. Alternativ
  *Classic* (immer gleiche Farbe).
- **Theme:** *Dark room* (klassisch dunkel) / *Light room* — helles
  Papier-Display für Umgebungen mit viel Licht.
- **Music:** Soundtrack an/aus.
- **Key bindings:** *Original Umoria* / *Rogue-like (hjkl)*.
- **Fullscreen:** echter Vollbildmodus ohne Rahmen (auch F11).

> **ESC im Vollbild:** Browser reservieren ESC fürs Verlassen des
> Vollbilds — das lässt sich nicht abschalten. Deshalb gilt im Vollbild:
> **Leertaste** schließt Menüs/Läden, **`=`** öffnet das Optionsmenü,
> und der erste ESC-Druck verlässt nur das Vollbild (der zweite wirkt
> dann wieder im Spiel).

## Musik & Sprache

- **Chiptune-Soundtrack im C64/SID-Stil** (Arpeggios, Rechteck- und
  Dreieck-Wellen), live per WebAudio erzeugt — keine Audiodateien nötig.
- **Erzähler-Stimmen:** Beim Abstieg (alle 5 Ebenen-Meilensteine und
  gelegentlich zufällig) werden ~45-Sekunden-Ausschnitte aus Audio-Clips in
  `audio/voice/voice1.mp3` … `voice8.mp3` eingespielt, die Musik wird dabei
  leiser gemischt. Mitgeliefert ist eine **gemeinfreie LibriVox-Lesung von
  Beowulf** — dem Epos, das Tolkien maßgeblich inspirierte.

> **Hinweis zu Tolkien-Originalaufnahmen:** Tolkiens eigene Lesungen
> (Caedmon Records, aufgenommen 1952) sind **urheberrechtlich geschützt**
> und nicht frei verfügbar. Wer sie besitzt (z. B. die *J.R.R. Tolkien Audio
> Collection*), kann eigene Ausschnitte einfach als `voice2.mp3` usw. in
> `audio/voice/` legen — sie werden automatisch erkannt. Weitere freie
> Alternativen: [LibriVox](https://librivox.org/) (gemeinfreie Lesungen von
> Beowulf, der Edda, Sigurd-Sagas, Kalevala u. a.).

## Easter Egg

*pedo mellon a minno.* — Wer die Inschrift der Tore von Durin kennt, weiß,
was auf dem Titelbildschirm zu tippen ist …

## Credits

- **Moria** (1983) — Robert A. Koeneke; **Umoria** — Jim E. Wilson
  ([Quellcode](https://github.com/dungeons-of-moria/umoria))
- CRT-Look inspiriert von [cool-retro-term](https://github.com/Swordfish90/cool-retro-term)
- Schrift: [VT323](https://fonts.google.com/specimen/VT323) (Google Fonts)
- Beowulf-Lesung: [LibriVox](https://librivox.org/beowulf-by-unknown/),
  Public Domain
- Dieses Remake ist ein Fan-Projekt, neu geschrieben in Vanilla-JavaScript.
