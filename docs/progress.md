# Fortschritt

_Aktueller Stand, wird nach jeder Arbeitssitzung aktualisiert. Details erledigter Schritte und ältere Sitzungsnotizen: `docs/history.md`._

## Überblick

- [x] Grundgerüst aus Preset (TypeScript, esbuild, ESLint, Vitest, i18n en/de, Einstellungen mit `schemaVersion`)
- [x] Konzept und offene Konzeptfragen geklärt (`docs/concept.md`)
- [x] Zeilenweises Frontmatter-Schreiben per `vault.process` (`processFrontMatter` verworfen)
- [x] Einstellungen (Ablageordner, verwaltete Ordner, Dateinamen-Schema, Struktur-Eigenschaft, Größe, Papierkorb-Tag, KI-Ordner, angezeigte Ordner; Settings-Schema 7)
- [x] Befehle „Neue Notiz“ / „Neue Ordner-Notiz“, mit Synonymen
- [x] Struktur-Index und Anbindung an den `metadataCache`
- [x] Seitenleiste „Struktur“ mit Markierungen, Symbolleiste, Suche, „Im Baum anzeigen“, ruhiger Optik
- [x] Kontextmenü (mit „Mehr …“), Aufklapp-Zustand pro Gerät gespeichert
- [x] Titel-Sync, dynamische Titelanzeige, `@@`-Vorschläge, „Titel ändern“, „Fehlende Titel ergänzen“
- [x] Einordnen: Drag & Drop (Desktop), Menü, „Hier ablegen“ (auch auf dem Tablet)
- [x] „Struktur prüfen“ (Duplikate, tote Links, Zyklen)
- [x] Papierkorb
- [x] Strukturdatei für KI-Werkzeuge (`.ai-context/moc-tree/structure.md`, Git-tauglich)
- [x] Bereich „Ordner“ (echte Ordner nur lesend, alle Dateitypen, Einordnen daraus)
- [x] Schnittstelle für andere Plugins (`MocTreeApi` Version 1, `create_note`)
- [x] Tablet-Tests (Stand 2026-11-11)
- [x] Repo auf GitHub (`origin`)

## Nächste Schritte

1. Im echten Vault prüfen: Strukturdatei per Git teilen, nach Pull auf zweitem Gerät keine Änderung an der Datei
2. Brotkrumen: Pfad der aktiven Notiz unter dem Suchfeld, Glieder anklickbar
3. README mit Nutzeranleitung, danach Version 0.2.0

## Offene Punkte und Ideen

- [ ] `structure_view.ts` aufteilen (jetzt 325 Zeilen, Grenze ca. 300)
- [ ] Neuere Funktionen (Bereich „Ordner“, KI-Ordner) auf dem Tablet prüfen
- [ ] Alten Pfad `.moc-tree/structure.md` im echten Vault von Hand löschen (wird nicht mehr geschrieben, bleibt aber liegen)
- Geplante Funktionen für später: `docs/concept.md`, Abschnitt „Später“

## Bekannte Probleme

- Wayland: Strg muss vor dem Ziehen gedrückt sein; während des Ziehens gedrückt wird es nicht erkannt (Chromium liefert dort keine Tastenzustände)
- Lesemodus aktualisiert Titel erst beim nächsten Rendern der Notiz; kein Hover-Vorschau-Popup für Titel-Links in der Live Preview
- Hinweis: `npm run dev` kann Zwischenstände bauen, während mehrere Dateien geändert werden; `t()` fällt deshalb auf Englisch bzw. den Schlüssel zurück, statt abzustürzen
- Drag & Drop nur am Desktop; auf Mobilgeräten Einordnen per Menü und „Hier ablegen“
- Umschalt-Klick (ganzer Unterbaum auf-/zuklappen) hat eine Obergrenze von 2000 Positionen
- `@codemirror/state` und `@codemirror/view` stehen in `devDependencies`; Versionen beim Update an die von `obsidian` angleichen (sonst Lint-Warnung)
- Ältere Testnotizen mit Strich oder Buchstaben-Suffix im Dateinamen bleiben gültig; der Dateiname ist für die Struktur egal

## Notizen zur letzten Sitzung

- 2026-11-19: „Hier ablegen“ ganz oben und farbig im Kontextmenü; Ordnerzeilen mit eigenem Text in der Ordner-Notiz zweigeteilt (links aufklappen, rechtes Drittel öffnet die Notiz). Noch in Obsidian und auf dem Tablet zu testen.
- 2026-11-11: Zusammenspiel mit `bible-annotating` geklärt. Kopplung nur über Frontmatter-Konventionen, moc-tree bleibt unverändert. bible-annotating schreibt eigene Notizen jetzt zeilenweise (kein `processFrontMatter` mehr außer bei Kapitel-/Buch-Notizen), bevorzugt `title` in der Anzeige und legt Themen-Notizen mit `title`/`aliases` an. Empfehlung: `Bibel/` nicht freigeben, `Bibelstudium/Themen` kann freigegeben werden.
- 2026-11-11: Papierkorb, „Hier ablegen“ und Strukturdatei für KI-Werkzeuge umgesetzt, getestet und committet.
- 2026-11-11: Erster Commit `f698474` (lokal, kein Remote).
