import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
// WASM + model are loaded from CDN => internet needed at first launch.
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export async function createPoseLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  const make = (delegate) => PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: 'VIDEO', numPoses: 1,
  });
  try { return await make('GPU'); } catch { return await make('CPU'); } // fallback CPU
}
