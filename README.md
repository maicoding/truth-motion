# Eine Bewegung. Zwei Urteile.

Browserexperiment für Truth Machines mit MediaPipe und Three.js. Eine gemeinsame Bewegung erhält zwei unterschiedliche sprachliche Deutungen. Schwelle, Glättung und alle vier Bezeichnungen sind direkt auf der Seite veränderbar.

## Online

Die Veröffentlichung ist für GitHub Pages vorbereitet. Für die Nutzung dort genügen Browser und optional eine Webcam. Es sind keine Installation, kein Python und kein API-Schlüssel erforderlich.

## Bedienung

Simulation oder Webcam starten. Sechs Sekunden numerische Handpunkte aufnehmen und in einer Schleife wiedergeben. Regeln ändern und denselben Input vergleichen. Die Erklärungen stehen in anleitung.html.

Kamerabilder bleiben im Browser. Die Anwendung enthält keine Upload- oder Analysefunktion. Der JSON-Export wird gezielt ausgelöst. Alle psychologischen Zuschreibungen sind erfunden.

## Dateien

- index.html, style.css: Oberfläche
- app.js: Eingabe, Aufnahme, Wiedergabe und Three.js
- rules.js: Messregel und Interpretation
- vendor/: lokale Bibliotheken und Handmodell, Lizenztexte
- modelltest.html: Modellinitialisierung und Inferenz auf leerem Testbild

## GitHub Pages

Statische Dateien, kein Build erforderlich. Ordner mit index.html als Pages-Quelle veröffentlichen. Relative Pfade funktionieren auch in einem Repository-Unterordner. Die veröffentlichte Seite muss über HTTPS geöffnet werden, damit der Kamerazugriff verfügbar ist.

Die originale lokale Tutorialfassung bleibt separat erhalten. Browser- und Modellprüfungen der ursprünglichen Fassung sind dokumentiert; die Webcam-Erprobung mit realer Hand steht aus.
