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

Ist die Einstellung „Strukturdatei für KI-Werkzeuge“ an, hält das Plugin `.moc-tree/structure.md` in der Vault-Wurzel aktuell (Erklärung des Formats, Baum, Waisen, Papierkorb, Tabelle Dateiname → Titel). Obsidian Sync überträgt den Ordner nicht; bei Git, Syncthing o. Ä. selbst ausschließen (z. B. `.moc-tree/` in `.gitignore` bzw. `.stignore`).

Damit eine KI die Datei findet, in die `CLAUDE.md` bzw. `AGENTS.md` des Vaults eintragen:

```markdown
## Notizstruktur (Plugin MOC Tree)

Die Notizen sind ohne Ordner strukturiert. Dateinamen sind meist Nummern; Titel, Baum und
Zuordnung Dateiname → Titel stehen in `.moc-tree/structure.md` (versteckter Ordner, wird
automatisch erzeugt). Diese Datei zuerst lesen und nie bearbeiten; geändert wird die Struktur
nur über die Eigenschaft `children` der Ordner-Notizen.
```
