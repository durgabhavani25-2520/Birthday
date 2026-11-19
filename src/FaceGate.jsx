import React, { useEffect, useRef, useState } from 'react';

const visionModuleUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';
const visionWasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const faceModelUrl = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

function cameraErrorMessage(error) {
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Camera access was blocked. Allow camera permission in your browser’s site settings, then try again.';
  }
  if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
    return 'No usable camera was found. Connect a camera and try again.';
  }
  if (error.name === 'NotReadableError') {
    return 'The camera may be in use by another app. Close that app and try again.';
  }
  return 'The camera scan could not start. Check your camera connection and internet access, then try again.';
}

export default function FaceGate({ onUnlock }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(0);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (detectorRef.current) {
      detectorRef.current.close();
      detectorRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => () => stopCamera(), []);

  const startScan = async () => {
    setErrorMessage('');
    setStatus('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Camera access needs a supported browser and a secure connection (HTTPS or localhost).');
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      await videoRef.current.play();
      setStatus('loading');

      const { FaceDetector, FilesetResolver } = await import(/* @vite-ignore */ visionModuleUrl);
      const vision = await FilesetResolver.forVisionTasks(visionWasmUrl);
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: faceModelUrl, delegate: 'CPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.65,
      });
      detectorRef.current = detector;
      setStatus('scanning');

      let consecutiveFaces = 0;
      let lastVideoTime = -1;
      let lastDetectionTime = 0;
      const scanFrame = () => {
        const video = videoRef.current;
        if (!video || !detectorRef.current || !streamRef.current?.active) return;

        const now = performance.now();
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          && video.currentTime !== lastVideoTime
          && now - lastDetectionTime >= 150) {
          lastVideoTime = video.currentTime;
          lastDetectionTime = now;
          try {
            const result = detectorRef.current.detectForVideo(video, now);
            consecutiveFaces = result.detections.length ? consecutiveFaces + 1 : 0;
            if (consecutiveFaces >= 2) {
              setStatus('success');
              stopCamera();
              onUnlock();
              return;
            }
            setStatus(result.detections.length ? 'scanning' : 'no-face');
          } catch (error) {
            console.error('Face detection failed while scanning the camera stream.', error);
            stopCamera();
            setCameraActive(false);
            setErrorMessage('Face detection stopped unexpectedly. Check your connection and try again.');
            setStatus('error');
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      };
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      console.error('Unable to start the on-device face scan.', error);
      stopCamera();
      setCameraActive(false);
      setErrorMessage(cameraErrorMessage(error));
      setStatus('error');
    }
  };

  const busy = ['requesting', 'loading', 'scanning', 'no-face'].includes(status);

  return <section className="face-gate" aria-labelledby="face-gate-title">
    <div className="face-gate-card">
      <span className="face-gate-icon" aria-hidden="true">✧</span>
      <p className="eyebrow">A little surprise, just for Akka</p>
      <h1 id="face-gate-title">A face before the surprise</h1>
      <p className="face-gate-intro">Allow camera access and look toward the camera to open your birthday page.</p>
      <video ref={videoRef} className={`face-gate-video ${cameraActive ? 'active' : ''}`} autoPlay muted playsInline aria-label="Live camera preview" />
      <p className="face-gate-status" role="status" aria-live="polite">
        {status === 'idle' && 'Your camera starts only after you tap the button.'}
        {status === 'requesting' && 'Requesting camera permission…'}
        {status === 'loading' && 'Camera is ready. Loading the on-device face detector…'}
        {status === 'scanning' && 'Looking for a face…'}
        {status === 'no-face' && 'No face detected yet. Move into the frame and make sure your face is well lit.'}
        {status === 'error' && errorMessage}
      </p>
      <button className="face-gate-button" type="button" onClick={startScan} disabled={busy}>
        {status === 'error' ? 'Try camera scan again' : 'Allow camera & scan'}
      </button>
      <p className="face-gate-privacy">Face detection runs on this device. No camera image is saved or sent. This checks for a face, not a person’s identity.</p>
    </div>
  </section>;
}
