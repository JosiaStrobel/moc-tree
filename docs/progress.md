# Fortschritt

_Einzige Stelle für den Umsetzungsstand. Wird nach jeder Arbeitssitzung aktualisiert._

## Aktueller Schritt

- [x] Plugin aus Preset angelegt (2026-11-10): TypeScript, esbuild, ESLint (obsidianmd), Vitest, i18n (en/de), Einstellungen mit `schemaVersion`, Beispielbefehl `hello`
- [x] Konzeptentwurf in `docs/concept.md` erstellt; offene Fragen stehen dort
- [x] Konzept auf fehlplatzierte Inhalte geprüft; offene Fragen bereinigt
- [x] Offene Konzeptfragen geklärt (2026-11-10): kein Plugin-Tag, stattdessen freigegebene Ordner; mehrere Wurzeln; Mehrfach-Symbol; Eigenschaft einstellbar
- [x] `processFrontMatter` geprüft (2026-11-10, Dev-Befehl `dev-frontmatter-probe`): schreibt das ganze Frontmatter neu, auch ohne Änderung. Entfernt Kommentare, `007` → `7`, Flow-Listen → Block, `>` → `|`, vereinheitlicht Anführungszeichen und Einrückung. Text unter dem Frontmatter bleibt unberührt. → Nicht verwendbar, Schreiben per `vault.process`
- [x] Entschieden: auch `title`/`aliases` zeilenweise per `vault.process` (im Konzept eingetragen)
- [x] Dev-Befehl und Testordner `moc-tree-probe/` entfernt
- [x] Modul für zeilenweises Frontmatter-Schreiben (2026-11-10): `frontmatter_lines.ts` (Listeneintrag einfügen/entfernen/ersetzen, Einzelwert setzen) und `yaml_scalar.ts`; übernimmt Einrückung, Anführungszeichen, Flow/Block-Stil und Zeilenenden; gibt bei unsicheren Formen `null` zurück. Tests u. a. mit der Testnotiz aus der `processFrontMatter`-Prüfung
- [x] Einstellungen umgesetzt (2026-11-10): Ablageordner, verwaltete Ordner (Liste mit Ordnerauswahl), Dateinamen-Schema, Struktur-Eigenschaft; deklarative Settings-API, `schemaVersion` 2 (Migration von 1). Reine Logik in `scope.ts` / `settings.ts` mit Tests
- [x] Einstellungen in Obsidian getestet (2026-11-10), Liste aktualisiert sich direkt
- [x] Einstellungen auf dem Tablet prüfen (Hinzufügen per Tippen)
- [x] Befehle „Neue Notiz“ (`new-note`) und „Neue Ordner-Notiz“ (`new-folder`) (2026-11-10): Dialog für Titel und ggf. Dateinamen, legt Ablageordner bei Bedarf an, Konflikte → „Name 2“, öffnet die Notiz; ersetzt Beispielbefehl `hello`. Einordnen als Unterordner folgt mit der Seitenleiste
- [x] Befehle in Obsidian getestet (2026-11-10)
- [x] Struktur-Index als reine Logik (2026-11-10): `structure_index.ts` mit Tests. Wurzeln (verwaltete MOCs ohne Eltern, nach Titel sortiert), Waisen (verwaltete normale Notizen, die von keiner Wurzel erreichbar sind), Eltern je Notiz für das Mehrfach-Symbol, doppelte Einträge zusammengefasst, tote Links und Zyklen als eigene Zeilenart. MOCs, die nur in einem Zyklus hängen, erscheinen ersatzweise oben
- [x] Anbindung an den `metadataCache` (2026-11-10): `structure_frontmatter.ts` (Titel, Struktur-Eigenschaft, Links in Listenreihenfolge; mit Tests) und `structure_store.ts` (sammelt verwaltete Notizen plus Ziele außerhalb, baut den Index bei Bedarf, Neuaufbau nach Änderungen um 300 ms verzögert, auch nach Einstellungsänderungen). Vorübergehender Befehl `dev-structure-dump` gibt den Baum in die Konsole aus
- [x] Dev-Befehl in Obsidian geprüft (2026-11-10): Baum, Waisen, tote Links, Zyklus, Mehrfach-Einordnung und fehlender Titel stimmen; Schlüsselformat `children.N` bestätigt
- [x] Markierung „außerhalb“ in Obsidian geprüft (2026-11-10)
- [x] Seitenleiste „Struktur“ (2026-11-10): `structure_view.ts` (ItemView, Baum mit Obsidians `tree-item`-Klassen, Ordner anfangs zugeklappt, Aufklapp-Zustand pro Position solange die Leiste offen ist, Bereich „Waisen“ einklappbar, Klick öffnet die Notiz, Strg-Klick neuer Tab), `tree_markers.ts` (Symbole für mehrfach mit Anzahl, außerhalb, kein Titel, tot, Zyklus; Tooltip und Hinweis per Tippen), `structure_view_open.ts`. Befehl `open-structure` und Ribbon-Symbol. Dev-Befehl `dev-structure-dump` entfernt
- [x] Seitenleiste am Desktop geprüft (2026-11-10)
- [x] Seitenleiste auf dem Tablet prüfen (Auf-/Zuklappen per Tippen, Markierung antippen → Hinweis)
- [x] Kontextmenü in der Seitenleiste (2026-11-10): `tree_menu.ts`, `structure_actions.ts` (Schreiben per `vault.process` nur bei echter Änderung, Hinweis bei unsicherem Frontmatter), `convert_note_modal.ts`; neue reine Funktionen `add_empty_list` und `remove_key` in `frontmatter_lines.ts` mit Tests. „Neue Notiz/Ordner-Notiz hier“ hängt am Ende der Liste an
- [x] Kontextmenü am Desktop geprüft (2026-11-10)
- [x] Kontextmenü auf dem Tablet prüfen (langes Tippen)
- [x] Titel-Sync (2026-11-10): `title_aliases.ts` (reine Logik mit Tests), `title_sync.ts` (nur aktive verwaltete Notiz, merkt Titel beim Öffnen, schreibt nach 2 s Pause oder beim Notizwechsel). Neue Listeneinträge nur noch bei Bedarf in Anführungszeichen (Links weiterhin immer)
- [x] Titel dynamisch anzeigen (2026-11-10): `plain_link.ts` (mit Tests), `title_links.ts` (Lesemodus per Post-Processor), `title_links_editor.ts` (Live Preview per CodeMirror-ViewPlugin; Linkpositionen aus dem `metadataCache`, roher Link sichtbar, solange der Cursor darauf steht; Klick öffnet, Strg-Klick neuer Tab)
- [x] Titel-Sync und Titelanzeige in Obsidian geprüft (2026-11-10)
- [x] Link-Vorschläge mit `@@` (2026-11-10): `note_search.ts` (Titel/Alias, Präfix vor Enthalten, akzent-tolerant; mit Tests), `link_suggest.ts`. Index enthält jetzt `aliases`
- [x] „Titel ändern“ (2026-11-10): `change_title.ts`, `change_title_modal.ts`; im Kontextmenü der Seitenleiste und im Dateimenü verwalteter Notizen
- [x] `@@`-Vorschläge und „Titel ändern“ in Obsidian geprüft (2026-11-10)
- [x] `@codemirror/state` 6.7.6 und `@codemirror/view` 6.43.13 als `devDependencies` eingetragen (gleiche Versionen wie über `obsidian`; behebt Lint-Warnung)
- [x] „Front Matter Title“ im Test-Vault eingerichtet und geprüft (2026-11-11): alles an außer „Alias“ und „Note Link“; verträgt sich mit Seitenleiste, Live-Preview-Titeln und `@@`
- [x] Drag & Drop und Einordnen per Menü (2026-11-11): `list_placement.ts` (Einfügen/Verschieben an Position, mit Tests), `wiki_link_path` und `read_list_items` (mit Tests), `is_within` gegen Zyklen (mit Test), `structure_moves.ts`, `tree_drag.ts` (nur Desktop), `tree_menu_move.ts`, `folder_pick_modal.ts`. Bereich „Waisen“ wird jetzt immer angezeigt (auch als Ablageziel)
- [x] Drag & Drop und Menü am Desktop geprüft (2026-11-11). Strg-Erkennung für „zusätzlich einordnen“ unter Wayland: Strg wird beim Drücken der Maustaste gemerkt (Drag-Events haben dort keine Tastenzustände); gestrichelter Rahmen zeigt das Kopieren an
- [x] Einordnen per Menü auf dem Tablet prüfen
- [x] Aufklapp-Zustand speichern (2026-11-11): `expand_state.ts` (mit `schemaVersion`, Umbenennen nachführen, gelöschte Pfade entfernen; mit Tests), gespeichert per `app.saveLocalStorage` pro Gerät und Vault
- [x] Aufklapp-Zustand in Obsidian geprüft (2026-11-11)
- [x] Befehl „Struktur prüfen“ (`check-structure`, 2026-11-11): `structure_check.ts` (Duplikate, tote Links, Zyklus-Mitglieder; mit Tests), `remove_list_indices` (mit Tests), `check_structure.ts`, `structure_check_modal.ts`; Symbol in der Seitenleiste
- [x] „Struktur prüfen“ in Obsidian geprüft (2026-11-11)
- [x] Seitenleiste überarbeitet (2026-11-11): Symbole statt Dreiecke, Anzahl der Einträge, Einrückungslinien, „Waisen“ als Abschnittsüberschrift; Klick klappt Ordner, Doppelklick öffnet (`double_click.ts` mit Tests, übersteht das Neuzeichnen); „Öffnen“ und „In neuem Tab öffnen“ im Kontextmenü
- [x] Neue Seitenleiste am Desktop geprüft (2026-11-11)
- [x] Doppeltippen auf dem Tablet prüfen
- [x] Einstellung „Größe der Seitenleiste“ (`treeSize`, `schemaVersion` 3, Migration von 2; mit Test) und Umschalt-Klick für ganzen Unterbaum (`tree_keys.ts` mit Tests, Obergrenze 2000 Positionen); Touch: „Alle Unterordner auf-/zuklappen“ im Menü (2026-11-11)
- [x] Größe und Umschalt-Klick am Desktop geprüft (2026-11-11)
- [x] „Im Baum anzeigen“ und Suche (2026-11-11): `tree_find.ts` (alle Stellen einer Notiz, Ordner über Treffern; mit Tests), Befehl `reveal-active-note`, Symbol in der Seitenleiste, Dateimenü (`file_menu.ts`), Markierung der aktiven Notiz, Suchfeld; Aufklapp-Zustand nach `expand_store.ts` ausgelagert
- [x] Symbolleiste im Explorer-Stil über dem Suchfeld (2026-11-11): Im Baum anzeigen, Alle zuklappen, Struktur prüfen (`addAction` ist in Seitenleisten unsichtbar)
- [x] „Im Baum anzeigen“, Suche und Symbolleiste in Obsidian geprüft (2026-11-11)
- [x] Kontextmenü neu geordnet (2026-11-11): seltene Punkte am PC hinter „Mehr …“, auf dem Tablet unten
- [x] Kontextmenü: „Mehr …“ öffnet das Menü erweitert neu; Reihenfolge nach Wunsch angepasst (2026-11-11)
- [x] Neues Kontextmenü in Obsidian geprüft (2026-11-11)
- [x] Ruhigere Optik (2026-11-11): Weg zur aktiven Notiz hervorgehoben, Wurzeln als Abschnitte, Notizen ohne Symbol, Anzahl nur bei zugeklappten Ordnern; `structure_view.ts` aufgeteilt (`tree_active.ts`, `tree_toolbar.ts`, Suchfilter in `tree_find.ts`), jetzt 290 Zeilen
- [x] Flächen statt Linien (2026-11-11): offene Ordner als neutral graue Blöcke nach Ebene (`data-level`), Einrückung per `data-depth` (bis 12), Notizen ohne Symbol bündig, Notizen gedämpft, aktive Notiz mit Akzentbalken; farbige Linien auf dem Weg entfernt
- [x] Optik am Desktop geprüft (2026-11-11)
- [x] Synonyme beim Anlegen (2026-11-11): optionales Feld im Dialog „Neue Notiz“, durch Komma getrennt, landen nach dem Titel in `aliases` (`parse_synonyms` mit Tests)
- [x] Synonym-Feld in Obsidian geprüft (2026-11-11)
- [x] Papierkorb (2026-11-11): Tag in `tags` (Einstellung, Standard `papierkorb`, Settings-Schema 4), Links bleiben stehen; im Baum, in Suche und `@@` ausgeblendet; Bereich „Papierkorb“ (Aufklapp-Zustand Schema 2), Wiederherstellen, Endgültig löschen (mit Rückfrage, bei Ordnern Einträge verschieben), Papierkorb leeren (Kontextmenü des Bereichs), Befehl „Aktive Notiz in den Papierkorb“. Neue Module `trash_tag.ts` (mit Tests), `trash_actions.ts`, `choice_modal.ts`; aus `structure_view.ts` ausgelagert: `tree_row.ts`, `tree_sections.ts`
- [x] Papierkorb in Obsidian geprüft (2026-11-11)
- [x] Tablet-Tests (2026-11-11): Einstellungen, Seitenleiste, Kontextmenü, Einordnen per Menü, Doppeltippen, Optik funktionieren; Einordnen per Ordnersuche umständlich
- [x] Verschieben per Auswählen und „Hier ablegen“ (2026-11-11): `tree_clipboard.ts` (Auswahl, Ziel-Prüfung, Verfallen; mit Tests), `tree_pending_bar.ts` (Leiste mit ✕); ersetzt die Ordnersuche (`folder_pick_modal.ts` entfernt). Bereiche „Waisen“/„Papierkorb“ nach `tree_sections.ts` ausgelagert
- [x] „Hier ablegen“ in Obsidian geprüft (Desktop und Tablet, 2026-11-11)
- [x] Strukturdatei für KI-Werkzeuge (2026-11-11): `structure_export.ts` (reine Darstellung, mit Tests), `structure_export_writer.ts` (5 s verzögert, nur bei geändertem Inhalt, über `vault.adapter`), Einstellung `structureFile` (Settings-Schema 5, Standard aus), Befehl `write-structure-file`; README-Baustein für die `CLAUDE.md` des Vaults
- [x] Strukturdatei in Obsidian geprüft (2026-11-11)

## Bekannte Probleme

- Wayland: Strg muss vor dem Ziehen gedrückt sein; während des Ziehens gedrückt wird es nicht erkannt (Chromium liefert dort keine Tastenzustände)
- Lesemodus aktualisiert Titel erst beim nächsten Rendern der Notiz; kein Hover-Vorschau-Popup für Titel-Links in der Live Preview
- Hinweis: `npm run dev` kann Zwischenstände bauen, während mehrere Dateien geändert werden; `t()` fällt deshalb auf Englisch bzw. den Schlüssel zurück, statt abzustürzen

## Notizen zur Sitzung

- 2026-11-11: Papierkorb, „Hier ablegen“ und Strukturdatei für KI-Werkzeuge umgesetzt, getestet und committet.
- 2026-11-11: Erster Commit `f698474` (lokal, kein Remote).
- 2026-11-10: Konzeptfragen geklärt (freigegebene Ordner statt Tag), `processFrontMatter` verworfen, Einstellungen, Frontmatter-Zeilenmodul und Befehle „Neue Notiz“/„Neue Ordner-Notiz“ umgesetzt und getestet. Zufallssuffix auf zwei Ziffern umgestellt, danach Trennstrich entfernt (`2026111009123048`); ältere Testnotizen mit Strich oder Buchstaben-Suffix bleiben gültig, der Dateiname ist für die Struktur egal. Zyklus-Ersatzwurzel und genauere Waisen-Definition ins Konzept übernommen.

## Nächster Schritt

Bestehende Notizen übernehmen oder Brotkrumen (Pfad der aktiven Notiz unter dem Suchfeld, Glieder anklickbar). Daneben: README mit Nutzeranleitung, Version 0.2.0, optional privates GitHub-Repo als Backup.
