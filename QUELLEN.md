# Quellen und festgelegte Versionen

Stand: 15.10.2026. Das Tutorial verwendet bewusst festgelegte Versionen zur Reproduzierbarkeit. Neuere Releases sind damit nicht ausgeschlossen.

- Three.js 0.180.0: `three.module.js` und `three.core.js`, heruntergeladen von https://cdn.jsdelivr.net/npm/three@0.180.0/build/ . MIT-Lizenz: vendor/THREE-LICENSE.txt. Dokumentation: https://threejs.org/docs/pages/WebGLRenderer.html .
- MediaPipe Tasks Vision 0.10.21: vision_bundle.mjs und SIMD-/Nicht-SIMD-WASM-Dateien, heruntergeladen von https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/ . Apache-2.0-Lizenztext: vendor/MEDIAPIPE-LICENSE.txt . Die Bibliotheksdateien enthalten eigene Copyright-Hinweise.
- MediaPipe Hand Landmarker, float16, Modellversion 1: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task . Herkunft und Modellbeschreibung: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker . Modellkarte: https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20%28Lite_Full%29%20with%20Fairness%20Oct%202021.pdf . Die Modellnutzung ist getrennt von einer selbst verfassten Deutungsregel zu beurteilen.
- Web-API und Koordinaten: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js . Aufruf im VIDEO-Modus mit Zeitstempel, ein erkanntes Handobjekt, CPU-Delegate.

## Eigene Implementierung

Tutorialtexte, HTML, CSS, rules.js, app.js und serve.py wurden für diese Aufgabe erstellt. Die Wörter „entschlossen“, „unsicher“, „zögerlich“ und „besonnen“ sind erfundene Zuordnungen ohne Validierung. Die Handbreiten-Normierung und Glättung sind transparent gewählte Berechnungsschritte. Keine Quelle belegt hier eine Beziehung zwischen Geschwindigkeit und Persönlichkeit oder Gefühlen.

## Weitergabe

Bei Weitergabe den gesamten Ordner einschließlich Lizenzdateien und Quellenangaben beibehalten. Keine externen Bilder, Fonts oder Videos sind eingebunden. Den Einsatzstand und eigene Änderungen im Prüfprotokoll vermerken.
