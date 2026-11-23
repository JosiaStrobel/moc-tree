# MOC Tree

Obsidian-Plugin. Structure notes without folders: MOC notes with a children list form a tree in the sidebar.

## Entwicklung

```bash
npm install
npm run dev     # Watch-Build, Hot Reload lädt das Plugin neu
npm run build   # Produktions-Build mit Typprüfung
npm run lint
npm test
npm version patch   # Version in manifest.json und versions.json erhöhen
```

## Strukturdatei für KI-Werkzeuge

Alle Dateien für KI-Werkzeuge liegen im „Ordner für KI-Dateien“ (Einstellung, Standard `.ai-context/` in der Vault-Wurzel). Der Ordner wird von mehreren Plugins geteilt, jedes schreibt in einen eigenen Unterordner. Ist die Einstellung „Strukturdatei“ an, hält MOC Tree dort zwei Dateien aktuell: `moc-tree/structure.md` (Erklärung des Formats, Baum, Waisen, Papierkorb; klein genug zum ganz Lesen) und `moc-tree/notes.md` (Tabelle Dateiname → Titel, Aliasse, Ordner; zum Durchsuchen). Obsidian Sync überträgt Punkt-Ordner nicht; bei Git, Syncthing o. Ä. selbst ausschließen (z. B. `.ai-context/` in `.gitignore` bzw. `.stignore`). Ältere Versionen schrieben nach `.moc-tree/structure.md`; dieser Ordner kann gelöscht werden.

Soll eine KI die Datei über das Git-Repo lesen (z. B. Claude mit GitHub-Zugriff), den Ordner nicht ausschließen, sondern mit committen. Alle Geräte erzeugen aus denselben Notizen dieselbe Datei; ein Konflikt entsteht nur, wenn zwei Geräte vor dem Abgleich die Struktur ändern. Für diesen Fall in die `.gitattributes` des Vaults:

```
.ai-context/** merge=union
```

Git behält dann beide Fassungen ohne Konfliktmarker, und das Plugin schreibt die Datei kurz darauf wieder korrekt.

Damit eine KI die Datei findet, in die `CLAUDE.md` bzw. `AGENTS.md` des Vaults eintragen:

```markdown
## Notizstruktur (Plugin MOC Tree)

Die Notizen sind ohne Ordner strukturiert. Dateinamen sind meist Nummern. Den Baum mit Titeln
enthält `.ai-context/moc-tree/structure.md`, die Zuordnung Dateiname → Titel `notes.md` im selben
Ordner (versteckt, wird automatisch erzeugt). `structure.md` zuerst lesen, in `notes.md` nur
gezielt suchen; beide nie bearbeiten. Geändert wird die Struktur nur über die Eigenschaft
`children` der Ordner-Notizen.
Die Datei kann gegenüber den neuesten Commits veraltet sein (sie wird erst beim nächsten
Sync von einem Gerät mit Obsidian aktualisiert). Für Notizen, die danach geändert wurden,
`title` und `children` direkt aus dem Frontmatter lesen.
```
