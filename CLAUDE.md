# MOC Tree – Obsidian-Plugin

Structure notes without folders: MOC notes with a children list form a tree in the sidebar.

Erstellt aus dem eigenen Obsidian-Plugin-Preset (basiert auf dem Obsidian Sample-Plugin).

**Konzept und Entscheidungen stehen in `docs/concept.md`.** Vor größeren Änderungen dort nachlesen. Bei Unklarheiten oder Abweichungen vom Konzept erst nachfragen.

## Technik

- TypeScript (`"strict": true`) → gebündelt zu `main.js` mit esbuild; Typen aus `obsidian`. Paketmanager: npm.
- `npm install` · `npm run dev` (Watch) · `npm run build` (Produktion inkl. Typprüfung) · `npm run lint` (ESLint mit `eslint-plugin-obsidianmd`) · `npm test` (Vitest, Testdateien `*.test.ts` neben dem Code)
- Abhängigkeiten aktuell halten, nicht an die Versionen der Sample-Vorlage gebunden. Grenzen durch Peer-Abhängigkeiten: TypeScript ≤ 6.0 (`typescript-eslint`), ESLint 9 (`eslint-plugin-obsidianmd`).
- Einstiegspunkt `src/main.ts`. Release-Dateien: `main.js`, `manifest.json`, `styles.css`.
- Build-Artefakte (`node_modules/`, `main.js`) nicht committen.
- Kein `npm audit fix --force` (stuft `eslint-plugin-obsidianmd` zurück); Audit-Meldungen aus dem Lint-Plugin betreffen nur das Linting.

## Feste Regeln

- **Mobile ist Pflicht:** `isDesktopOnly: false`. Keine Node.js-/Electron-APIs (`fs`, `path`, `child_process` …); Dateizugriff nur über `app.vault` / `app.vault.adapter`.
- **Bedienung per Touch und Stift** mitdenken: Hover-Funktionen brauchen immer eine Alternative per Tippen oder Gedrückthalten, Drag & Drop eine Alternative per Menü (Muster siehe unten).
- **Offline:** Keine Netzwerkzugriffe, keine Telemetrie, kein Nachladen von Code. Nur im Vault lesen und schreiben.
- **Nutzerdaten nie überschreiben:** Notizen nur dort ändern, wo nötig, und nur bei echter Änderung schreiben. Fremde Properties (auch die anderer Plugins) unverändert lassen.
- **Urheberrecht:** Geschützte Inhalte nie ins Repo, in Tests oder Beispieldaten; nur per Import durch den Nutzer. Für Tests gemeinfreie Daten.

## Struktur

- `src/main.ts` klein halten: nur Lebenszyklus (`onload`/`onunload`), Registrieren von Befehlen, Views und Einstellungen. Logik in Module auslagern.
- Eine klare Aufgabe pro Datei; ab ca. 200–300 Zeilen aufteilen.
- Logik von Obsidian trennen: reine Funktionen ohne Obsidian-Abhängigkeit, mit Unit-Tests (Vitest).

## Coding-Stil

- Alle Listener und Intervalle über `this.registerEvent()`, `this.registerDomEvent()`, `this.registerInterval()`, damit beim Deaktivieren nichts zurückbleibt. Code so schreiben, dass Neuladen keine Listener verdoppelt.
- Kein `innerHTML`; DOM über `createEl()` / `createDiv()` aufbauen.
- Immer `this.app`, nie das globale `app`.
- Keine Inline-Styles; CSS-Klassen in `styles.css` mit Obsidian-CSS-Variablen (`--text-normal`, `--background-primary` …), damit Hell-/Dunkelmodus und Themes funktionieren.
- Pfade mit `normalizePath()`; Plattform-Unterschiede über `Platform` (z. B. `Platform.isMobile`).
- `async/await` statt Promise-Ketten; kein `any` ohne Begründung im Kommentar.
- Start schlank halten: keine schwere Arbeit in `onload`, Lazy Initialization. Teure Reaktionen auf Datei-Events debouncen.
- Neue npm-Abhängigkeiten nur nach Rückfrage; nur browser-kompatible, kleine Pakete.
- Alle gespeicherten Formate tragen eine `schemaVersion`; beim Laden alter Versionen migrieren statt fehlerhaft lesen.
- Einstellungen mit Standardwerten und Validierung; laden/speichern über `this.loadData()` / `this.saveData()`. Einstellungsseite mit der deklarativen API (`getSettingDefinitions`, ab `minAppVersion` 1.13.0).
- `data.json` wird zwischen Geräten synchronisiert: gerätespezifischen Zustand (Aufklappen, Scrollposition …) per `this.app.saveLocalStorage` / `loadLocalStorage` speichern, ebenfalls mit `schemaVersion`.
- Befehle über `this.addCommand()` mit stabilen IDs (nicht umbenennen).
- Fehler für den Nutzer über `new Notice(...)`, technische Details per `console.error`.
- UI-Texte mehrsprachig (Deutsch und Englisch), kurz und klar; nie direkt im Code, sondern über `t('schlüssel')` aus `src/i18n/`. `en.ts` ist die Referenz, jede weitere Sprache braucht alle Schlüssel. Satzstil: Englisch nur erstes Wort groß (prüft ESLint), Deutsch nur erstes Wort groß außer Substantive. (Grund für `src/i18n/`: Die Lint-Regel `sentence-case` passt nicht zu deutschen Texten im Code.) `t()` fällt bei fehlendem Schlüssel auf Englisch bzw. den Schlüssel zurück, weil `npm run dev` auch Zwischenstände baut.

## Erprobte Muster (aus MOC Tree, Ripe, Bible Annotating)

### Frontmatter schreiben

- **Kein `processFrontMatter` für Notizen, die dem Nutzer gehören.** Es schreibt das ganze Frontmatter neu, auch ohne Änderung (entfernt Kommentare, `007` → `7`, Flow-Listen → Block, `>` → `|`, Anführungszeichen und Einrückung vereinheitlicht).
- Stattdessen zeilenweise per `this.app.vault.process`: nur die betroffenen Zeilen ändern, Einrückung, Quoting und Zeilenenden übernehmen. Bei unsicheren Formen nicht schreiben, sondern überspringen und melden. Vorlage: `frontmatter_lines.ts` / `yaml_scalar.ts` aus MOC Tree (mit Tests) übernehmen statt neu schreiben.
- `processFrontMatter` nur für Dateien, die das Plugin vollständig selbst erzeugt und verwaltet.

### Touch, Stift, Tablet

- Standard-Geste: kurz tippen = Hauptaktion, gedrückt halten (0,4–0,5 s, kurze Vibration) = Menü oder Details; Rechtsklick und Hovern mit Maus zeigen dasselbe. Abbruch bei Bewegung > 10 px.
- Klicks per `addEventListener('click')` bzw. `registerDomEvent(…, 'click', …)`, nicht `onClickEvent` (reagiert auch auf Rechtsklick über `auxclick`).
- Wird nach Gedrückthalten neu gezeichnet, landen Androids nachfolgendes `click` und Long-Press-`contextmenu` auf dem Element, das jetzt dort liegt: `click` nur nach eigenem `pointerdown` werten, `contextmenu` kurz nach einem Touch-/Stift-Druck ignorieren.
- Obsidians Hover-Popup zeigt mit Finger und Stift wenig: eigenes Feld unter dem Element, schließt beim Tippen daneben.
- Stift über `pointerType: 'pen'` bei `pointerdown` erkennen (Android-WebView liefert kein `touchType`). Während der Stift aufliegt Fingereingaben ignorieren (Handballen).
- Wisch- und Ziehgesten an Griffen oder Zeichenflächen nicht weiterreichen (sonst öffnet Obsidian die Seitenleisten); `touch-action: none` für Gleitgesten.
- Androids Zielkorrektur trifft gern das Nachbarelement: Trefferflächen großzügig, kleine Elemente nicht direkt nebeneinander.
- Dialoge auf Mobilgeräten oben (Tastatur), Zahlen mit −/+ statt nur Tippen; lange Ansichten unten mit Platz zum Weiterscrollen.
- Drag & Drop nur am Desktop. Unter Wayland liefern Drag-Events keine Tastenzustände: Modifier beim `pointerdown` merken.

### Obsidian-Eigenheiten

- Symbolnamen unterscheiden sich zwischen Obsidian-Versionen: Kandidatenliste mit `getIcon()` prüfen und das erste vorhandene nehmen.
- Schwere Arbeit (Index aufbauen, Dateien scannen) erst nach `workspace.onLayoutReady`; Reaktionen auf `metadataCache`-/Vault-Events entprellen (300 ms – 3 s).
- Große Daten stückweise laden und cachen, nie alles auf einmal (Speicher auf dem Tablet).
- Live Preview über ein CodeMirror-ViewPlugin; `@codemirror/*` nur als devDependency, Versionen an die von `obsidian` angleichen.
- Interne, undokumentierte APIs nur mit Rückfall verwenden und unter „Bekannte Probleme“ in `progress.md` notieren (nach Obsidian-Updates prüfen).

### Zusammenspiel mit meinen anderen Plugins und KI

- Kopplung an andere eigene Plugins nur über Frontmatter-Konventionen (z. B. `title` und `aliases` für MOC Tree) oder deren kleine versionierte API (`MocTreeApi`), optional: ohne das andere Plugin muss alles funktionieren.
- Speichert das Plugin Daten in Notizen, eine Formatbeschreibung für KI-Werkzeuge nach `.ai-context/<plugin-id>/format.md` schreiben (Ordner als Einstellung `aiFolder`, Standard `.ai-context`, wird nie indexiert). Statische Beschreibung statt berechnetem Stand; nur schreiben, wenn sich der Inhalt gegenüber der Datei auf dem Gerät ändert (Git-Sync über mehrere Geräte), feste Sortierung, klein halten.

## Manifest

- Plugin-ID `moc-tree` – stabil halten, entspricht dem Ordnernamen im Vault. `version` nach SemVer; `minAppVersion` aktuell halten, wenn neuere APIs genutzt werden.

## Testen in Obsidian

- Entwickelt wird im **Test-Vault `PluginDev`**, nicht im echten Studien-Vault.
- Das Projekt liegt direkt in `PluginDev/.obsidian/plugins/moc-tree/`; `npm run dev` baut bei jeder Änderung automatisch, das Plugin „Hot Reload“ lädt es danach selbst neu.
- Node.js ≥ 18. Neue Obsidian-API-Versionen mit `npm update`.
- Regelmäßig auch auf dem Android-Tablet testen: Syncthing überträgt `main.js`, `manifest.json` und `styles.css` (Muster in `PluginDev/.stignore` um das neue Plugin ergänzen, auf dem Tablet ebenso). Auf Mobile gibt es kein Hot Reload: Plugin aus- und einschalten.
- Tests in Obsidian kann Claude nicht selbst ausführen: konkrete Testschritte (Desktop und Tablet) mit erwartetem Ergebnis nennen und auf Rückmeldung warten. Ungetestetes in `progress.md` als offen vermerken.
- Für Testdaten eine Beispieldatei im Test-Vault anlegen, die alle Fälle abdeckt (auch fehlerhafte).

## Arbeitsweise

- **Zu Beginn jeder Sitzung `docs/progress.md` lesen**, um den aktuellen Stand zu kennen.
- **Am Ende jeder Sitzung `docs/progress.md` aktualisieren und kurz halten** (Überblick abhaken, nächste Schritte, offene Punkte, bekannte Probleme, Notizen zur letzten Sitzung). Details erledigter Schritte und ältere Sitzungsnotizen (alle außer den letzten 2–3) wörtlich ans Ende von `docs/history.md` verschieben.
- **Nichts doppelt pflegen:** aktueller Stand und offene Punkte nur in `docs/progress.md`, Verlauf nur in `docs/history.md` (nur ergänzen, nicht zu Beginn jeder Sitzung lesen, bei Bedarf durchsuchen), Konzept und Entscheidungen nur in `docs/concept.md`, Arbeitsregeln nur hier.
- Größere Funktionen erst im Konzept abstimmen, dann in nummerierte Teilschritte (z. B. 3a, 3b …) zerlegen.
- In kleinen Schritten arbeiten; nach jedem Schritt muss das Plugin bauen (`npm run build`), Linting und Tests bestehen (`npm run lint`, `npm test`) und in Obsidian laufen. Erst nach dem Test in Obsidian committen.
- Neue Konzeptentscheidungen in `docs/concept.md` nachtragen.

## Referenzen

- API-Dokumentation: https://docs.obsidian.md
- Plugin-Richtlinien: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
