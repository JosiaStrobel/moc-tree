# MOC Tree – Obsidian-Plugin für Notizstruktur ohne Ordner

Nov 10, 2026 · @Highcap

## Ziel und Anforderungen

Ziel ist ein Obsidian-Plugin, mit dem Notizen konfliktfreie Nummern als Dateinamen bekommen und trotzdem grafisch und ohne Ordner strukturiert werden können.

Deine Anforderungen bisher:

- **Ablageort:** Neue Notizen landen in einem einstellbaren Ordner (Standard: `Zettel`).
- **Freigegebene Ordner:** In den Einstellungen wählst du, welche Ordner das Plugin auswerten darf. Alle Notizen darin, auch in Unterordnern, sind verwaltete Notizen; ein Tag ist nicht nötig.
- **Dateiname egal:** Für Struktur und Anzeige spielt der Dateiname keine Rolle. In den Einstellungen legst du fest, ob neue Notizen nach festem Schema (z. B. Nummer) benannt werden oder ob du den Namen beim Anlegen frei wählst.
- **Titel ist Pflicht:** Jede verwaltete Notiz hat einen `title`, der in der Oberfläche angezeigt wird.
- **Aliasse:** `aliases` enthalten automatisch den Titel und können weitere Bezeichnungen haben, z. B. einen deutschen Titel.
- **Verlinken über den Titel:** Links fühlen sich wie normale Namen an, egal wie die Datei heißt.
- **Jeder Ordner ist eine MOC:** Jeder (Unter-)Ordner ist eine eigene MOC-Notiz, erkennbar allein an der Eigenschaft `children`. Normale Notizen lassen sich in Ordner umwandeln und zurück. Dadurch zeigt auch der normale Graph die Hierarchie korrekt.
- **Struktur getrennt von Querverweisen:** Die Struktur steht in `children`. Links im Text sind immer Querverweise.
- **Ordner-Ansicht:** Eine grafische Oberfläche wertet die MOCs aus und zeigt sie ähnlich wie eine Ordnerstruktur.
- **Waisen sehen:** Übersicht über alle verwalteten Notizen, die in keiner MOC stehen.
- **MOCs anlegen und Drag & Drop:** Neue MOCs direkt in der Oberfläche erstellen, Notizen und MOCs per Ziehen einordnen.

## Grundkonzept

Verwaltete Notizen erkennt das Plugin daran, dass sie in einem freigegebenen Ordner liegen. Angezeigt werden sie mit ihrem Pflicht-Titel. Jeder Ordner ist eine MOC-Notiz, und die Struktur steht in deren Eigenschaft `children`; Dateiname und genauer Speicherort sind dafür egal.

**Eine verwaltete Notiz** (z. B. `Zettel/202611100912.md`):

```yaml
---
title: Lenses
aliases: [Lenses, Linsen, Optische Linsen]
---
```

**Eine MOC** – `children` listet Unter-MOCs und Notizen in fester Reihenfolge, ohne Anzeigetexte und ein Link pro Zeile:

```yaml
---
title: Physik
aliases: [Physik]
children:
  - "[[2026110915301247]]"
  - "[[2026110916004512]]"
---
Freier Text der MOC. Links hier, z. B. zu [[2026111012000383|Mathematik]], sind Querverweise.
```

„Optik“ ist selbst eine MOC mit eigener `children`-Liste. So entsteht der Baum aus „MOC verlinkt MOC“, jede MOC kennt nur ihre direkten Kinder.

- **Dateiname:** Je nach Einstellung eine Nummer aus Zeitstempel mit Sekunden und zweistelliger Zufallszahl (z. B. `2026111009123048`, ohne Trennzeichen) oder ein frei gewählter Name. Das Suffix verhindert Kollisionen, wenn auf zwei Geräten gleichzeitig Notizen entstehen. Bei frei gewählten Namen fängt das Plugin Konflikte im Zielordner ab, etwa mit „Name 2“ oder einer Rückfrage.
- **title:** Pflicht. Fehlt er, markiert das Plugin die Notiz in der Oberfläche und zeigt ersatzweise den Dateinamen.
- **aliases:** Der Titel steht immer automatisch darin. Weitere Bezeichnungen wie ein deutscher Titel oder eine Abkürzung kommen dazu und bleiben beim Titel-Sync erhalten.
- **Freigegebene Ordner:** Nur Notizen in freigegebenen Ordnern und deren Unterordnern werden ausgewertet. Der Ablageordner ist immer freigegeben, damit neue Notizen nie aus der Seitenleiste verschwinden. Verlinkt eine `children`-Liste eine Notiz außerhalb, erscheint sie trotzdem im Baum, aber markiert („außerhalb“). So geht keine Struktur verloren, wenn eine Datei verschoben wird.
- **Ordner = hat `children`:** Eine Notiz ist ein Ordner, sobald sie die Eigenschaft `children` hat, auch wenn die Liste leer ist. Ein eigener MOC-Tag ist nicht nötig.
- **Keine Anzeigetexte in `children`:** Dort stehen nur `[[Dateiname]]`-Links. Den Titel zeigt die Seitenleiste an, daher ändert eine Titeländerung nur die eigene Datei.
- **Ordner mit Inhalt:** Jede MOC kann normalen Text enthalten, etwa eine Einleitung oder Querverweise.
- **Struktur vs. Querverweis:** Struktur = Links in `children`. Alle Links im Text, in MOCs wie in normalen Notizen, sind Querverweise.
- **Echte Links:** Links in Eigenschaften sind klickbar, erscheinen im Graph und in den Backlinks und werden beim Umbenennen angepasst. Im YAML stehen sie in Anführungszeichen, die Eigenschaft ist vom Typ Liste.
- **Mehrere Eltern:** Eine Notiz kann in mehreren `children`-Listen stehen und taucht dann in mehreren Ordnern auf, in jedem mit eigener Position. Das ist ein bewusster Grund für children statt einer up-Eigenschaft, denn up kennt keine Reihenfolge pro Ordner. Die Seitenleiste zeigt dann ein dezentes Symbol mit der Anzahl der Ordner; Tooltip und Tippen nennen die anderen Ordner.
- **Mehrere Wurzeln:** Es gibt keine Pflicht-Wurzel-MOC. Jede MOC, die in keiner `children`-Liste steht, erscheint auf der obersten Ebene. Hängen MOCs nur in einem Zyklus (A in B, B in A), erscheint ersatzweise eine davon oben, damit nichts unsichtbar wird.

Vorteile: Der Core-Graph zeigt die Hierarchie ohne Tricks, das Plugin muss keine Einrückungen parsen, und Verschieben ändert nur zwei Frontmatter-Listen. Dafür gibt es mehr kleine MOC-Dateien, und die Gesamtstruktur steht nicht in einer einzelnen Datei.

## Plugin-Funktionen

Das MVP besteht aus einem Befehl für neue Notizen und einer Seitenleiste mit Baum und Waisen-Liste.

**MVP**

1. **Befehl „Neue Notiz“:** fragt nach dem Titel (Pflicht), optional nach Synonymen (durch Komma getrennt, kommen nach dem Titel in `aliases`) und, je nach Einstellung, nach dem Dateinamen. Legt die Datei im Ablageordner mit `title` und `aliases` an und öffnet sie. Aus der Seitenleiste heraus wird sie direkt in den gewählten Ordner eingetragen.
2. **Befehl „Neuer Ordner“:** wie oben, zusätzlich mit leerer `children`-Liste; optional gleich als Unterordner. Aus der Seitenleiste („Neue Notiz hier“ / „Neue Ordner-Notiz hier“ im Kontextmenü eines Ordners) wird der Link am Ende der `children`-Liste angehängt.
3. **Umwandeln:** Rechtsklick bzw. langes Tippen „In Ordner umwandeln“ fügt eine leere `children`-Liste hinzu. „In Notiz umwandeln“ entfernt sie; hat der Ordner noch Kinder, fragt das Plugin, ob sie in den übergeordneten Ordner wandern (angehängt am Ende seiner Liste) oder nur aus dem Ordner entfernt werden (sie werden dann zu Waisen, sofern sie in keinem anderen Ordner stehen). Übergeordnet ist der Ordner, unter dem die Zeile im Baum angeklickt wurde; auf oberster Ebene gibt es nur das Entfernen. Erst wird der übergeordnete Ordner ergänzt, dann die Liste entfernt, damit ein Fehler höchstens doppelte Einträge hinterlässt.
4. **Titel-Sync:** Ändert sich `title`, ersetzt das Plugin den alten Titel in `aliases` durch den neuen (an derselben Stelle), zusätzliche Aliasse bleiben stehen. Steht der alte Titel nicht darin, kommt der neue an den Anfang. Andere Dateien werden nicht angefasst. Nur für die aktive Notiz, nachdem das Tippen ca. 2 s pausiert; beim Start und für Änderungen per Sync wird nichts geschrieben.
4a. **Titel dynamisch anzeigen:** Links ohne Anzeigetext (`[[2026111009123048]]`) zeigen im Lesemodus und in der Live Preview den aktuellen Titel der verlinkten Notiz, damit Links nach einer Titeländerung aktuell bleiben, ohne andere Dateien anzufassen. Links mit festem Anzeigetext (`[[…|Text]]`) bleiben, wie sie sind. Im Quelltextmodus und außerhalb von Obsidian steht die Nummer. Graph, Backlinks, Tabs, Datei-Explorer und Schnellwechsler übernimmt das Community-Plugin „Front Matter Title“ (Eigenschaft `title`; „Note Link“ aus, weil es Anzeigetexte in Dateien schreibt, „Alias“ aus, weil es die Aliasse im `metadataCache` verändert, die MOC Tree liest); MOC Tree baut das nicht nach, weil es Eingriffe in Obsidian-Interna bräuchte.
4b. **Links per Titel einfügen:** `@@` im Editor öffnet Vorschläge, die verwaltete Notizen nach Titel und Aliassen suchen (Groß-/Kleinschreibung und Akzente egal) und `[[Dateiname]]` ohne Anzeigetext einfügen. Obsidians `[[`-Vorschläge bleiben unverändert, für bewusst feste Anzeigetexte.
4c. **Titel ändern:** Im Kontextmenü der Seitenleiste und im Dateimenü (Explorer, Tab) verwalteter Notizen; ändert `title` und `aliases` in einem Schreibvorgang. Der Dateiname bleibt; Obsidians „Umbenennen“ ändert weiterhin nur den Dateinamen.
5. **Seitenleiste „Struktur“:**
   - Baum aus den `children`-Listen, Ordner und Notizen mit Titel; MOCs ohne Eltern bilden die oberste Ebene
   - Bereich „Waisen“ mit allen verwalteten normalen Notizen (keine MOCs), die vom Baum aus nicht erreichbar sind, also in keiner `children`-Liste stehen oder nur in einer nicht eingeordneten MOC außerhalb der freigegebenen Ordner
   - Symbol bei Notizen in mehreren Ordnern, Markierung bei Notizen außerhalb der freigegebenen Ordner
   - Hinweis bei Notizen ohne Titel
   - Klick auf eine Notiz öffnet sie; Klick auf einen Ordner klappt ihn auf/zu, Doppelklick (bzw. Doppeltippen) oder Strg-Klick öffnet die Ordner-Notiz; „Öffnen“ zusätzlich im Kontextmenü
   - Optik: Ordner-Symbole statt Aufklapp-Dreiecken, Notizen ohne Symbol (ihr Name beginnt, wo bei Ordnern das Symbol steht, also bündig unter dem Namen des übergeordneten Ordners), Wurzeln wie Kapitelüberschriften mit Abstand und kräftigerer Schrift, jeder offene Ordner (Kopfzeile und Inhalt) als deckende, neutral graue Fläche in voller Breite, nach innen heller, innere Flächen bündig, nur die äußerste abgerundet (Einrückung über die Tiefe der Zeile statt über Linien); Ordnernamen in normaler Textfarbe, Notizen gedämpft; aktive Notiz mit schmalem Akzentbalken und leichter Tönung; Ordner-Symbole auf dem Weg zur aktiven Notiz in Akzentfarbe, Ordnernamen dort etwas kräftiger (Linien bleiben grau, sonst laufen bei tiefer Verschachtelung mehrere farbige Linien parallel); Anzahl der Einträge nur bei zugeklappten Ordnern (bei offenen beim Darüberfahren)
   - Umschalt-Klick auf einen Ordner klappt ihn mit allen Unterordnern auf bzw. zu (Touch: „Alle Unterordner auf-/zuklappen“ im Kontextmenü)
   - **Im Baum anzeigen:** Befehl, Symbol in der Seitenleiste und Dateimenü klappen den Weg zur aktiven bzw. gewählten Notiz auf, scrollen hin und heben sie kurz hervor; bei mehreren Stellen springt jeder weitere Aufruf zur nächsten (kürzeste Wege zuerst), Waisen öffnen den Bereich „Waisen“. Die aktive Notiz ist im Baum dauerhaft markiert
   - **Suche:** Feld oben filtert den Baum auf Notizen, deren Titel oder Alias passt (wie `@@`), samt den Ordnern auf dem Weg; diese sind dabei aufgeklappt, ohne den gespeicherten Aufklapp-Zustand zu ändern
   - Aufgeklappte Ordner und der Zustand von „Waisen“ bleiben über Neustarts erhalten; gespeichert pro Gerät und Vault im lokalen Speicher (`app.saveLocalStorage`), nicht in `data.json`, damit Sync die Geräte nicht gegenseitig überschreibt
6. **Drag & Drop (Desktop):** Ziehen entfernt den Link aus der alten `children`-Liste und fügt ihn in die neue ein, auch zum Umsortieren innerhalb eines Ordners. Mitte einer Ordner-Zeile = ans Ende dieses Ordners; oberer/unterer Rand einer Zeile = davor/danach im selben Ordner (Linie zeigt die Stelle). Mit gedrückter Strg-Taste (macOS: ⌘, vor dem Ziehen drücken) wird zusätzlich eingeordnet statt verschoben; ein gestrichelter Rahmen zeigt das an, im selben Ordner wird nur umsortiert. Ziehen auf „Waisen“ entfernt nur aus dem bisherigen Ordner, Ziehen aus „Waisen“ trägt nur ins Ziel ein. Ordner lassen sich nicht in sich selbst oder eigene Unterordner ziehen. Erst wird das Ziel geschrieben, dann die Quelle.
6a. **Einordnen per Menü (Touch und Desktop):** „Verschieben“ bzw. „Zusätzlich einordnen in“ wählt den Eintrag aus (Zeile gestrichelt und gedämpft, oben in der Seitenleiste eine Leiste mit Name und ✕ zum Abbrechen, auch Esc). Im Kontextmenü eines Ordners steht dann bei „Verschieben“ der Punkt „Hier ablegen“ (ans Ende der Liste), beim Bereich „Waisen“ entfernt es nur aus dem bisherigen Ordner; wo der Eintrag nicht hin kann (in sich selbst, eigene Unterordner, Ordner, die ihn schon enthalten), ist der Punkt ausgegraut. Die Auswahl gilt nur, solange die Seitenleiste offen ist, und verfällt still, wenn der Eintrag inzwischen verschwunden oder verschoben ist. Dazu „Nach oben“, „Nach unten“, „Aus Ordner entfernen“. Auf Mobilgeräten ist Ziehen abgeschaltet.
6c. **Papierkorb:** „In den Papierkorb“ (Kontextmenü, Dateimenü, Befehl) trägt den Papierkorb-Tag in `tags` im Frontmatter ein (zeilenweise wie bei `aliases`); ein Tag im Text zählt beim Lesen auch. Die Links in den `children`-Listen bleiben stehen, damit „Wiederherstellen“ (entfernt den Tag) die Notiz an ihren alten Platz zurückbringt; im Baum, in der Suche und bei `@@` sind Notizen im Papierkorb ausgeblendet. Unten in der Seitenleiste zeigt der Bereich „Papierkorb“ sie an (standardmäßig zugeklappt); Kinder eines Ordners im Papierkorb erscheinen dort unter ihm, sofern sie nicht zusätzlich in einem sichtbaren Ordner stehen, und zählen nicht als Waisen. „Endgültig löschen“ fragt nach, bei Ordnern mit Einträgen wie beim Umwandeln, ob diese in den übergeordneten Ordner wandern oder nur entfernt werden; dann werden die Links aus allen `children`-Listen entfernt und die Datei über Obsidians normales Löschen (`fileManager.trashFile`, beachtet Obsidians Papierkorb-Einstellung) gelöscht. „Papierkorb leeren“ (Kontextmenü des Bereichs) löscht alle markierten Notizen; Kinder ohne Tag bleiben und werden zu Waisen.
6d. **Strukturdatei für KI-Werkzeuge** (Einstellung, Standard aus; Befehl „Strukturdatei für KI-Werkzeuge schreiben“ auch ohne Einstellung): `.moc-tree/structure.md` in der Vault-Wurzel, damit eine KI die Struktur ohne Plugin versteht, obwohl Dateinamen Nummern sind und der Baum auf viele MOCs verteilt ist. Inhalt: kurze Erklärung des Formats mit den aktuellen Einstellungen, Baum als eingerückte Liste (Titel — Pfad, Markierungen; ein Ordner an mehreren Stellen wird nur einmal ausgeklappt), Waisen, Papierkorb und eine Tabelle aller Notizen (Dateiname, Titel, Aliasse, Eltern, Pfad). Ohne Zeitstempel; neu geschrieben ca. 5 s nach der letzten Strukturänderung und nur, wenn sich der Inhalt ändert. Punkt-Ordner zeigt Obsidian nicht an und Obsidian Sync überträgt sie nicht; andere Sync-Werkzeuge muss man selbst ausschließen. Die Datei wird nie gelesen, ist also keine zweite Wahrheit. Damit eine KI sie findet, verweist man in der eigenen `CLAUDE.md`/`AGENTS.md` des Vaults darauf (Baustein in der README); das Plugin schreibt diese Datei nicht.
6e. **Fehlende Titel ergänzen** (Befehl, für bestehende Notizen): Ordner mit alten Notizen werden über die Einstellungen verwaltet; der Befehl listet alle verwalteten Notizen ohne `title` (ohne Papierkorb) mit änderbarem Vorschlag und Häkchen (alle vorausgewählt). Vorschlag: erste `#`-Überschrift ohne Markdown-Zeichen, sonst der Dateiname; auch „Titel ändern“ füllt ihn bei fehlendem Titel vor. Pro Notiz ein Schreibvorgang (`title` setzen, Titel in `aliases` ergänzen); Dateiname und Ort bleiben. Unsicheres Frontmatter oder inzwischen gesetzter Titel → übersprungen, ein zusammenfassender Hinweis am Ende.
6b. **Reihenfolge im Kontextmenü:** Neue Notiz hier, Neue Ordner-Notiz hier (nur Ordner) · Titel ändern, Umwandeln, Aus Ordner entfernen · seltene Punkte (Öffnen, In neuem Tab öffnen, Nach oben, Nach unten, Alle Unterordner auf-/zuklappen, Verschieben, Zusätzlich einordnen in); „Hier ablegen“ steht bei ausgewähltem Eintrag direkt über „Verschieben“ am PC nach Klick auf „Mehr …“ unten angehängt (das Menü öffnet sich an derselben Stelle erweitert neu, da die API offene Menüs nicht ändern kann), auf dem Tablet direkt unten.

**Einstellungen**

- **Ablageordner** für neu angelegte Notizen (Standard: `Zettel`; fehlt er, wird er beim ersten Anlegen erstellt). Ist die Vault-Wurzel gewählt, ist der ganze Vault verwaltet.
- **Freigegebene Ordner:** Liste weiterer Ordner, die ausgewertet werden (rekursiv); der Ablageordner zählt immer dazu
- **Dateinamen neuer Notizen:** festes Schema (Zeitstempel mit Sekunden und Zufallssuffix) oder beim Anlegen frei wählbar
- **Name der Struktur-Eigenschaft** (Standard: `children`). Eine Änderung benennt bestehende Eigenschaften nicht automatisch um.
- **Papierkorb-Tag** (Standard: `papierkorb`, ohne `#`). Eine Änderung passt bestehende Tags nicht an.
- **Größe der Seitenleiste:** Kompakt, Normal (Standard), Groß; steuert Schrift, Symbole und Zeilenabstand
- **Strukturdatei für KI-Werkzeuge:** an/aus (Standard: aus), siehe 6d

**Später**

- `children` zusätzlich als Liste im Lesemodus der MOC anzeigen (gerendert, nicht in den Text geschrieben)
- **Vorhandene Struktur übernehmen** (erst relevant, wenn andere das Plugin mit bestehendem Vault nutzen; nach „Fehlende Titel ergänzen“). Gemeinsamer Kern: jede Quelle liefert Kanten „Eltern → Kind, Position“ plus Eltern ohne Notiz, für die eine MOC angelegt wird; danach Vorschau mit Häkchen, erst fehlende MOCs anlegen, dann je MOC ein Schreibvorgang (Anhängen an `children`). Nur ergänzen: Ordner, Eigenschaften und Text bleiben, ein zweiter Lauf fügt nichts doppelt ein. Quellen in dieser Reihenfolge:
  - **A. Echte Ordner** (Ordnerstruktur, PARA, Johnny Decimal, Plugin „Folder Notes“): Unterordner der verwalteten Ordner → MOC; vorhandene Folder Note (`X/X.md` oder `X.md` neben dem Ordner) wird zur MOC. Reihenfolge: Unterordner vor Notizen, alphabetisch bzw. nach Nummer. Offen: neue MOCs in den Ablageordner (Vorschlag) oder in den Ordner selbst; verwalteter Ordner selbst als Wurzel-MOC oder nicht (Vorschlag: nicht)
  - **B. Eigenschaften** (Plugin „Breadcrumbs“ `up`/`down`/`parent`/`child`, LYT `up::`, ExcaliBrain, Dataview-Felder): `down`/`child` direkt mit Reihenfolge; `up`/`parent` umgekehrt, nach Titel sortiert. Namen der Eigenschaften im Dialog änderbar
  - **C. Linklisten im Text** (klassische MOCs, Strukturzettel, Index-Notizen): Links aus Listenpunkten in Textreihenfolge, ohne Einbettungen; Vorschau mit Häkchen je Link, da Querverweise darunter sein können. Offen: pro Notiz im Menü (Vorschlag) oder für alle Notizen auf einmal
  - Seltener, nur bei Bedarf: Hierarchie in Dateinamen (Folgezettel `1a1`, Dendron `a.b.c`, Logseq `a/b`), verschachtelte Tags (`#a/b`)
- Mehrere Notizen auf einmal einordnen (Mehrfachauswahl), z. B. für viele Waisen nach dem Übernehmen
- Strukturdatei aufteilen, falls sie bei großen Vaults (einige tausend Notizen) zu lang wird: `structure.md` (Erklärung und Baum) und `notes.md` (Tabelle Dateiname → Titel, zum gezielten Durchsuchen)

## Technischer Entwurf

Alles Benötigte bietet die Obsidian-API direkt.

- **Seitenleiste:** eigene `ItemView`, registriert über `registerView`. Drag & Drop mit nativem HTML5-Drag-API.
- **Struktur lesen:** `metadataCache.getFileCache(file).frontmatterLinks` liefert die Links aus `children` getrennt von den Links im Text; daraus entsteht der Baum.
- **Struktur schreiben:** eigenes Modul aus reinen Funktionen, das einzelne Frontmatter-Zeilen ändert; angewendet per `vault.process` (atomar). Kein `processFrontMatter`, siehe „Stabile Formatierung“.
- **Aktualisierung:** auf `metadataCache.on("changed")` hören und den Baum neu zeichnen.
- **Zyklen:** Beim Aufbau des Baums besuchte MOCs merken, damit eine MOC, die sich über Umwege selbst enthält, keine Endlosschleife auslöst; beim Drag & Drop solche Züge verhindern.
- **Mobil:** Drag & Drop per Touch ist schwieriger; zusätzlich „Einordnen in …“ per Menü.

**Sync-Robustheit**

Ziel: möglichst wenige Dateien pro Aktion ändern und alles so schreiben, dass zeilenweises Zusammenführen (Obsidian Sync, Git) funktioniert.

- **Ein Link pro Zeile:** `children` immer als Block-Liste schreiben, nie als `[a, b, c]` in einer Zeile. So kollidieren nur Änderungen an derselben Zeile.
- **Minimale Writes:** Titeländerung = eine Datei, Verschieben = zwei Dateien. Nichts Abgeleitetes speichern (keine Anzeigetexte, keine Zähler, kein „zuletzt geändert“).
- **Nur bei Nutzeraktionen schreiben:** Nie beim Start, beim Öffnen einer Datei oder automatisch im Hintergrund; nur schreiben, wenn sich wirklich etwas ändert. Gilt für Notizen; einzige Ausnahme ist die lokale, nicht synchronisierte Strukturdatei (6d).
- **Stabile Formatierung:** Schreiben darf andere Felder nicht umformatieren. `processFrontMatter` schreibt das ganze Frontmatter neu, auch ohne Änderung (entfernt Kommentare, ändert `007` zu `7`, Flow-Listen zu Block-Listen, Anführungszeichen). Daher ändert das Plugin alle Felder (`children`, `title`, `aliases`) zeilenweise per `vault.process` und fasst nur die betroffenen Zeilen an. Erkennt es eine Form, die es nicht sicher bearbeiten kann, schreibt es nichts und zeigt einen Hinweis.
- **Keine eigene Struktur-Datenbank:** Den Baum immer aus dem `metadataCache` ableiten, nicht in `data.json` zwischenspeichern, damit es keine zweite Wahrheit gibt.
- **Kollisionsfreie IDs:** Zeitstempel mit Sekunden plus Zufallssuffix, damit gleichzeitig auf zwei Geräten angelegte Notizen nie denselben Namen bekommen.
- **Tolerant lesen:** Folgen eines Konflikts sichtbar machen statt abzustürzen. Doppelte Einträge zusammenfassen, tote Links markieren, Notizen nach einem Doppel-Verschieben in beiden Ordnern oder als Waise anzeigen. Ein Befehl „Struktur prüfen“ (auch als Symbol in der Seitenleiste) listet Duplikate und tote Links je Ordner mit Häkchen auf: Duplikate sind vorausgewählt (der erste Eintrag bleibt), tote Links nicht, weil die Notiz eventuell nur noch nicht synchronisiert ist. Bereinigt werden nur angehakte Einträge, ein Schreibvorgang pro Ordner. Zyklen werden nur gemeldet, nicht automatisch aufgelöst.
- **Notizen selbst nie anfassen:** Beim Verschieben werden nur MOC-Listen geändert. Ein Konflikt kann also höchstens die Einordnung verwürfeln, nie Inhalte verlieren.

## Offene Fragen

- [x] Eigenes Plugin oder Teil des Bibelstudien-Plugins? → eigenes Plugin `moc-tree`
- [x] Mehrfach-Einordnung kenntlich machen? → ja, dezentes Symbol mit Anzahl
- [x] Eine Wurzel-MOC oder mehrere? → mehrere Wurzeln
- [x] Struktur-Eigenschaft fest oder einstellbar? → einstellbar, Standard `children`
- [x] Standardwerte? → Ablageordner `Zettel`; statt Plugin-Tag freigegebene Ordner (rekursiv, Ablageordner immer dabei, Notizen außerhalb markiert anzeigen)
- [x] Titel beim Übernehmen bestehender Notizen vorschlagen? → ja: erste `#`-Überschrift, sonst Dateiname (6e)
