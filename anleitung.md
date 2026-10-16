# Eine Bewegung. Zwei Urteile.

Eine schnelle Handbewegung kann entschlossen wirken. Oder unsicher. Hier entstehen beide Urteile aus denselben Daten. Du kannst nachsehen, wie sie zustande kommen, und die Zuordnung ändern.

[Versuch öffnen](index.html)

## Ausprobieren

Starte zunächst die Simulation. Sie wechselt zwischen langsamen und schnellen Bewegungen. Unter beiden Formen steht derselbe Messwert. Die Wörter unterscheiden sich.

Wechsle dann zu **Webcam / eine Hand**, starte erneut und gib die Kamera frei. Zeige die Handfläche und bewege die Hand seitlich. Halte ungefähr denselben Abstand zur Kamera. Nimm die Hand kurz aus dem Bild. Die Urteile sollten pausieren.

Die Bilder werden in deinem Browser verarbeitet. Eine Aufnahme speichert nur Handpunkte als Zahlen. Mit **Stoppen** endet der Kamerastream.

## Dieselbe Bewegung wiederholen

Klicke **6 Sekunden aufnehmen**. Bewege die Hand zunächst langsam, anschließend schnell. Sobald die Aufnahme fertig ist, wähle **Aufnahme wiederholen**. Jetzt läuft dieselbe Folge von Handpunkten in einer Schleife. Die Kamera ist aus.

Verändere die **Schwelle**. Welche Abschnitte erhalten ein anderes Urteil, obwohl sich die Aufnahme nicht verändert?

Stelle anschließend eine feste Schwelle ein und verändere die **Glättung**. Warte eine vollständige Schleife ab. Kurze Ausschläge werden unterschiedlich stark gedämpft.

## Die Wörter ändern

Unter den Formen stehen vier Textfelder. Schreibe dort andere Deutungen hinein. Was könnte dieselbe schnelle Bewegung noch bedeuten? Was ändert sich, wenn langsame Bewegung als „konzentriert“ oder „unentschieden“ bezeichnet wird?

Die Tabelle zeigt die aktuellen Regeln. Die Anwendung verwendet keine validierte Beziehung zwischen Bewegung und diesen Wörtern. Deine Eingaben bleiben bis zum Neuladen der Seite erhalten. **Regeln zurücksetzen** stellt die Ausgangsfassung wieder her.

## Die Darstellung prüfen

Lass eine zweite Person die Anwendung bedienen. Frage, welches Urteil glaubwürdiger wirkt und woran sie das festmacht. Haltet eine konkrete Beobachtung fest. Zwei Personen liefern einen ersten Eindruck; die Wirkung auf andere bleibt offen.

Vergleicht eine Ausgangsfassung mit einer veränderten Regel. Haltet dafür fest:

| Eingabe | Schwelle | Glättung | Wörter | Was hat sich verändert? |
|---|---|---|---|---|
| dieselbe Aufnahme | | | | |
| dieselbe Aufnahme | | | | |

Ein Screenshot mit Messwert und Tabelle hält die Zuordnung fest. **Messdaten speichern** exportiert die Handpunkte und die aktuellen Regeln als JSON. Ein Import ist in dieser Fassung nicht vorgesehen.

## Was wird hier gemessen?

MediaPipe schätzt 21 Handpunkte pro Bild. Das Programm berechnet die Geschwindigkeit des Handzentrums und teilt sie durch die sichtbare Handbreite. So entsteht der Wert in **Handbreiten pro Sekunde**. Die Schwelle teilt ihn in zwei Bereiche. Jeder Bereich bekommt zwei selbst gewählte Bezeichnungen.

Drehung, Verdeckung, Licht und Perspektive beeinflussen die Schätzung. Eine fehlende Hand unterbricht die Auswertung. Ein hoher Wert belegt die berechnete Bewegung oberhalb einer gewählten Schwelle. Die Deutung einer Person wird von uns hinzugefügt.

**Zum Schluss:** Welche Aussage trägt die Messung tatsächlich? Welche Wirkung entsteht erst durch Wörter, Farben und Formen?

[Zur Anwendung](index.html) · [Quellen und Versionen](QUELLEN.md)
