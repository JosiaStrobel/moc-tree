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

## Feste Regeln

- **Mobile ist Pflicht:** `isDesktopOnly: false`. Keine Node.js-/Electron-APIs (`fs`, `path`, `child_process` …); Dateizugriff nur über `app.vault` / `app.vault.adapter`.
- **Bedienung per Touch** mitdenken: Hover-Funktionen brauchen immer eine Alternative per Tippen.
- **Offline:** Keine Netzwerkzugriffe, keine Telemetrie, kein Nachladen von Code. Nur im Vault lesen und schreiben.
- **Nutzerdaten nie überschreiben.**

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
- Einstellungen mit Standardwerten und Validierung; laden/speichern über `this.loadData()` / `this.saveData()`.
- Befehle über `this.addCommand()` mit stabilen IDs (nicht umbenennen).
- Fehler für den Nutzer über `new Notice(...)`, technische Details per `console.error`.
- UI-Texte mehrsprachig (Deutsch und Englisch), kurz und klar; nie direkt im Code, sondern über `t('schlüssel')` aus `src/i18n/`. `en.ts` ist die Referenz, jede weitere Sprache braucht alle Schlüssel. Satzstil: Englisch nur erstes Wort groß (prüft ESLint), Deutsch nur erstes Wort groß außer Substantive.

## Manifest

- Plugin-ID `moc-tree` – stabil halten, entspricht dem Ordnernamen im Vault. `version` nach SemVer; `minAppVersion` aktuell halten, wenn neuere APIs genutzt werden.

## Testen in Obsidian

- Entwickelt wird im **Test-Vault `PluginDev`**, nicht im echten Studien-Vault.
- Das Projekt liegt direkt in `PluginDev/.obsidian/plugins/moc-tree/`; `npm run dev` baut bei jeder Änderung automatisch, das Plugin „Hot Reload“ lädt es danach selbst neu.
- Node.js ≥ 18. Neue Obsidian-API-Versionen mit `npm update`.
- Regelmäßig auch auf dem Android-Tablet testen.

## Arbeitsweise

- **Zu Beginn jeder Sitzung `docs/progress.md` lesen**, um den aktuellen Stand zu kennen.
- **Am Ende jeder Sitzung `docs/progress.md` aktualisieren** (Erledigtes abhaken, bekannte Probleme, Notizen zur Sitzung, nächster Schritt).
- **Nichts doppelt pflegen:** Umsetzungsstand nur in `docs/progress.md`, Konzept und Entscheidungen nur in `docs/concept.md`, Arbeitsregeln nur hier.
- In kleinen Schritten arbeiten; nach jedem Schritt muss das Plugin bauen (`npm run build`), Linting und Tests bestehen (`npm run lint`, `npm test`) und in Obsidian laufen.
- Neue Konzeptentscheidungen in `docs/concept.md` nachtragen.

## Referenzen

- API-Dokumentation: https://docs.obsidian.md
- Plugin-Richtlinien: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
