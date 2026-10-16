import * as THREE from 'three';
import { MotionMeter, interpret, labels } from './rules.js';

const $ = id => document.getElementById(id);
const meter = new MotionMeter();
let running = false, mode = 'demo', stream = null, tracker = null, loading = false;
let lastVideoTime = -1, demoTime = 0, lastFrame = 0, latest = null, samples = [], recordingAt = null;
let playbackAt = 0, playbackIndex = 0, playbackCycle = -1, trace = [];
const settings = { threshold: 2.5, tau: 0.18 };
for (const key of ['A','B']) for (const state of ['fast','slow']) $('rule' + key + state).textContent = `„${labels[key][state]}“`;
const overlay = $('overlay').getContext('2d');
const history = $('history').getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const connections = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];

function createScene(id, color) {
  try {
    const host = $(id), scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .1, flatShading: true }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6 }));
    mesh.add(edges); scene.add(mesh, new THREE.HemisphereLight(0xffffff, 0x8290a6, 2.2));
    const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(3, 4, 5); scene.add(light);
    new ResizeObserver(() => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    }).observe(host);
    return { scene, camera, renderer, mesh };
  } catch { $(id).textContent = '3D-Ausgabe nicht verfügbar. Die textliche Auswertung bleibt aktiv.'; return null; }
}
const scenes = [createScene('sceneA', 0x2649b8), createScene('sceneB', 0x9b3628)];

function renderJudgments(speed) {
  latest = speed;
  const result = interpret(speed, settings.threshold);
  const valid = result.fast !== null;
  const de = n => n.toFixed(2).replace('.', ',');
  $('measurement').textContent = `Geschwindigkeit: ${valid ? de(speed) : '—'} Handbreiten/s`;
  $('phase').textContent = valid ? `Zustand: ${result.fast ? 'oberhalb oder auf' : 'unterhalb'} der Schwelle` : 'Zustand: keine gültige Bewegungsmessung';
  for (const key of ['A', 'B']) {
    $('verdict' + key).textContent = result[key];
    $('reason' + key).textContent = valid ? `${de(speed)} ${result.fast ? '≥' : '<'} ${de(settings.threshold)} → „${result[key]}“` : 'Keine Deutung. Hand neu erfassen oder Versuch starten.';
  }
  $('evaluation').textContent = valid ? `Ein gemeinsamer Wert: v = ${de(speed)}. A → ${result.A}; B → ${result.B}.` : 'Aktuelle Auswertung: kein gültiger Wert → beide Systeme pausieren.';
}

function drawPoints(points, isDemo) {
  overlay.clearRect(0, 0, 640, 480);
  if (mode === 'camera' && $('video').readyState >= 2) overlay.drawImage($('video'), 0, 0, 640, 480);
  else { overlay.fillStyle = '#f1f3f6'; overlay.fillRect(0, 0, 640, 480); }
  if (!points) return;
  overlay.strokeStyle = '#2649b8'; overlay.lineWidth = 3;
  for (const line of connections) {
    overlay.beginPath();
    line.forEach((i, j) => { const p = points[i]; j ? overlay.lineTo(p.x * 640, p.y * 480) : overlay.moveTo(p.x * 640, p.y * 480); });
    overlay.stroke();
  }
  for (const p of points) { overlay.fillStyle = '#18202c'; overlay.beginPath(); overlay.arc(p.x * 640, p.y * 480, 4, 0, Math.PI * 2); overlay.fill(); }
}

function drawHistory(now) {
  trace = trace.filter(p => p.t > now - 6000);
  history.clearRect(0, 0, 640, 150);
  history.fillStyle = '#f1f3f6'; history.fillRect(0, 0, 640, 150);
  const y = v => 140 - Math.min(8, Math.max(0, v)) / 8 * 130;
  history.strokeStyle = '#9b3628'; history.setLineDash([8, 5]);
  history.beginPath(); history.moveTo(0, y(settings.threshold)); history.lineTo(640, y(settings.threshold)); history.stroke(); history.setLineDash([]);
  history.strokeStyle = '#18202c'; history.lineWidth = 2; history.beginPath();
  let open = false;
  for (const p of trace) { if (p.v === null) { open = false; continue; } const x = (p.t - now + 6000) / 6000 * 640; open ? history.lineTo(x, y(p.v)) : history.moveTo(x, y(p.v)); open = true; }
  history.stroke();
}

// Erzeugt ausschließlich Testdaten. Diese Punkte stammen aus keiner Kamera.
function simulatedHand(time) {
  const phase = (time / 1000) % 8;
  const fast = phase > 4;
  const cx = .5 + (fast ? .24 * Math.sin((phase - 4) * 7) : .14 * Math.sin(phase * 1.3));
  const cy = .62;
  const base = [[0,.16],[-.07,.10],[-.12,.04],[-.15,-.02],[-.18,-.06],[-.09,-.02],[-.10,-.12],[-.10,-.21],[-.10,-.28],[-.02,-.04],[-.02,-.15],[-.02,-.25],[-.02,-.32],[.05,-.02],[.06,-.12],[.07,-.21],[.08,-.27],[.12,.02],[.14,-.06],[.15,-.13],[.16,-.19]];
  return base.map(([x,y]) => ({ x: cx + x, y: cy + y }));
}

function ingest(points, time, aspect, now, save = true) {
  const speed = meter.update(points, time, aspect, settings.tau);
  drawPoints(points, mode !== 'camera'); renderJudgments(speed); trace.push({ t: now, v: speed });
  if (recordingAt !== null && save) {
    samples.push({ t: now - recordingAt, aspect, points: points ? points.map(({x,y}) => ({x,y})) : null });
    if (now - recordingAt >= 6000) {
      recordingAt = null; $('record').textContent = '6 Sekunden aufnehmen'; $('replay').disabled = false; $('export').disabled = false;
      $('status').textContent = 'Aufnahme fertig: sechs Sekunden numerische Handpunkte gespeichert. Die Wiedergabe führt beide Systeme mit diesen Punkten aus.';
    }
  }
}

function stopTracks() {
  stream?.getTracks().forEach(track => track.stop()); stream = null; $('video').srcObject = null;
}
function stop() {
  running = false; stopTracks(); meter.reset(); recordingAt = null;
  $('record').textContent = '6 Sekunden aufnehmen'; $('start').disabled = false; $('stop').disabled = true; $('record').disabled = true;
  renderJudgments(null); drawPoints(null); $('origin').textContent = 'Quelle: gestoppt';
  $('status').textContent = 'Gestoppt. Kamera beendet. Eine fertige Zahlenaufnahme bleibt bis zum Neuladen verfügbar.';
}

async function start() {
  if (loading) return;
  stop(); loading = true; $('start').disabled = true; $('source').disabled = true;
  mode = $('source').value;
  try {
    if (mode === 'camera') {
      $('status').textContent = 'Handmodell laden und Kamera anfordern …';
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera benötigt localhost oder HTTPS.');
      if (!tracker) {
        const { FilesetResolver, HandLandmarker } = await import('./vendor/vision_bundle.mjs');
        const vision = await FilesetResolver.forVisionTasks('./vendor/wasm');
        tracker = await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: './vendor/hand_landmarker.task', delegate: 'CPU' }, runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: .6, minHandPresenceConfidence: .6, minTrackingConfidence: .6 });
      }
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      $('video').srcObject = stream; await $('video').play();
    }
    lastVideoTime = -1; demoTime = 0; lastFrame = 0; trace = []; meter.reset(); running = true;
    $('stop').disabled = false; $('record').disabled = false;
    $('origin').textContent = mode === 'camera' ? 'Quelle: Webcam / MediaPipe Hand Landmarker' : 'Quelle: SIMULATION / berechnete Handpunkte';
    $('status').textContent = mode === 'camera' ? 'Kamera aktiv. Eine Hand vollständig zeigen; anschließend seitlich bewegen.' : 'Simulation aktiv: langsame und schnelle Phasen wechseln. Keine Kamera aktiv.';
  } catch (error) {
    stop(); $('status').textContent = `Start fehlgeschlagen: ${error.message}. Die Simulation bleibt verfügbar.`;
  } finally { loading = false; $('start').disabled = running; $('source').disabled = false; }
}

function frame(now) {
  const dt = lastFrame ? Math.min(.1, (now - lastFrame) / 1000) : 0; lastFrame = now;
  if (running) {
    if (mode === 'demo') { demoTime += dt * 1000; ingest(simulatedHand(demoTime), now, 4/3, now); }
    else if (mode === 'camera' && $('video').readyState >= 2 && $('video').currentTime !== lastVideoTime) {
      lastVideoTime = $('video').currentTime;
      try {
        const result = tracker.detectForVideo($('video'), now);
        ingest(result.landmarks[0] || null, now, $('video').videoWidth / $('video').videoHeight, now);
      } catch (error) { stop(); $('status').textContent = 'Tracking unterbrochen: ' + error.message; }
    } else if (mode === 'replay') {
      const duration = samples.at(-1).t + 50;
      const elapsed = now - playbackAt, cycle = Math.floor(elapsed / duration), t = elapsed % duration;
      if (cycle !== playbackCycle) { playbackCycle = cycle; playbackIndex = 0; meter.reset(); }
      while (playbackIndex < samples.length && samples[playbackIndex].t <= t) {
        const sample = samples[playbackIndex++];
        ingest(sample.points, sample.t, sample.aspect, now, false);
      }
    }
    // Bei ausbleibenden Kamera-Frames verfällt auch der letzte gültige Wert.
    if (mode === 'camera' && meter.previous && now - meter.previous.time > 300) { meter.reset(); renderJudgments(null); }
  }
  for (const scene of scenes) {
    if (!scene) continue;
    // Bearbeitungsstelle 3: Beide Formen erhalten denselben Bewegungswert.
    const strength = latest === null ? 0 : Math.min(latest / 8, 1);
    const targetScale = latest === null ? .55 : .7 + strength * .55;
    const alpha = 1 - Math.exp(-dt / .15);
    const scale = scene.mesh.scale.x + alpha * (targetScale - scene.mesh.scale.x);
    scene.mesh.scale.setScalar(scale);
    scene.mesh.material.wireframe = latest === null;
    if (!reducedMotion && latest !== null && running) { scene.mesh.rotation.y += dt * (.15 + strength * 2); scene.mesh.rotation.x = strength * .5; }
    scene.renderer.render(scene.scene, scene.camera);
  }
  drawHistory(now); requestAnimationFrame(frame);
}
$('start').onclick = start; $('stop').onclick = stop;
$('source').onchange = stop;
$('record').onclick = () => {
  if (!running || mode === 'replay') return;
  samples = []; recordingAt = performance.now(); $('replay').disabled = true; $('export').disabled = true;
  $('record').disabled = true; $('record').textContent = 'Aufnahme läuft …';
  $('status').textContent = 'Nimmt sechs Sekunden Zahlenwerte auf. Bitte langsam und schnell bewegen.';
  setTimeout(() => { if (running && mode !== 'replay') $('record').disabled = false; }, 6200);
};
$('replay').onclick = () => {
  if (samples.length < 2) return;
  stop(); mode = 'replay'; running = true; meter.reset(); trace = []; playbackAt = performance.now(); playbackCycle = -1;
  $('start').disabled = true; $('stop').disabled = false;
  $('origin').textContent = 'Quelle: WIEDERGABE / gespeicherte numerische Handpunkte';
  $('status').textContent = 'Wiedergabe in Schleife. Regeln verändern und dieselben Eingabepunkte erneut vergleichen. Kein Kamerabild gespeichert.';
};
for (const id of ['threshold','smoothing']) $(id).oninput = () => {
  settings.threshold = Number($('threshold').value); settings.tau = Number($('smoothing').value);
  $('thresholdValue').textContent = settings.threshold.toFixed(1).replace('.', ','); $('smoothingValue').textContent = settings.tau.toFixed(2).replace('.', ',');
  renderJudgments(latest);
};
const defaultLabels = structuredClone(labels);
function syncLabels() {
  for (const key of ['A','B']) for (const state of ['fast','slow']) {
    const field = $('label' + key + state);
    const value = field.value.trim() || 'ohne Bezeichnung';
    labels[key][state] = value;
    $('rule' + key + state).textContent = `„${value}“`;
  }
  renderJudgments(latest);
}
for (const key of ['A','B']) for (const state of ['fast','slow']) $('label' + key + state).oninput = syncLabels;
$('reset').onclick = () => {
  $('threshold').value = '2.5'; $('smoothing').value = '.18';
  for (const key of ['A','B']) for (const state of ['fast','slow']) $('label' + key + state).value = defaultLabels[key][state];
  syncLabels(); $('threshold').dispatchEvent(new Event('input'));
};
$('export').onclick = () => {
  const data = { format: 'truth-tracking-1', created: new Date().toISOString(), source: samplesSource, settings: { ...settings }, labels, notice: 'Erfundene Deutungsregeln. Keine psychologische Messung. Punkte in Bildkoordinaten, keine Bilder.', samples };
  const a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.href = url; a.download = 'truth-bewegungsdaten.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
let samplesSource = null;
$('record').addEventListener('click', () => { samplesSource = mode; });
window.addEventListener('pagehide', () => { stopTracks(); tracker?.close(); });
renderJudgments(null); requestAnimationFrame(frame);
