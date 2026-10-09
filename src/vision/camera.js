import { createPoseLandmarker } from './poseDetection.js';
const BONES = [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

// Opens the webcam, runs MediaPipe Pose every frame, pushes movement data via setInput. Returns a stop() function.
export function startCamera({ video, canvas, detector, setInput, onStatus }) {
  let raf, stopped = false, lm, stream, lastT = -1, lastS = '';
  const status = (s) => { const k = JSON.stringify(s); if (k !== lastS) { lastS = k; onStatus(s); } };
  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      video.srcObject = stream; await video.play();
      status({ loading: true }); lm = await createPoseLandmarker();
      if (stopped) { lm.close(); return; }
    } catch (e) { status({ error: e.message || 'Camera error' }); return; }
    const ctx = canvas.getContext('2d');
    const loop = () => {
      if (stopped) return;
      if (video.readyState >= 2 && video.currentTime !== lastT) {
        lastT = video.currentTime;
        const pts = lm.detectForVideo(video, performance.now()).landmarks?.[0];
        ctx.clearRect(0, 0, 640, 480);
        if (pts) {
          const legs = detector.legsVisible(pts);
          setInput(detector.process(pts));
          ctx.strokeStyle = legs ? '#6ee7ff' : '#ff7ad9'; ctx.lineWidth = 4; // skeleton overlay
          BONES.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pts[a].x * 640, pts[a].y * 480); ctx.lineTo(pts[b].x * 640, pts[b].y * 480); ctx.stroke(); });
          ctx.fillStyle = '#ffe066'; [11, 12, 23, 24, 25, 26, 27, 28].forEach((i) => { ctx.beginPath(); ctx.arc(pts[i].x * 640, pts[i].y * 480, 5, 0, 6.28); ctx.fill(); });
          status({ body: true, legs });
        } else status({ body: false });
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
  })();
  return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); lm?.close(); };
}
