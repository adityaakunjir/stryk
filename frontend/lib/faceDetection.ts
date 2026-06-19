import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  try {
    await faceapi.loadTinyFaceDetectorModel('/models');
    modelsLoaded = true;
  } catch (err) {
    console.error("Failed to load face detection models", err);
  }
}

export async function getSmartCropPosition(imgElement: HTMLImageElement): Promise<{ position: string, confidence: number }> {
  try {
    await loadFaceModels();
    
    const detection = await faceapi.detectSingleFace(
      imgElement,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
    );

    if (!detection) {
      return { position: "center 15%", confidence: 0 };
    }

    const { x, y, width, height } = detection.box;
    const imgWidth = imgElement.naturalWidth;
    const imgHeight = imgElement.naturalHeight;

    const faceCenterX = x + width / 2;
    // We want the face a bit higher up in the crop, so we target a point slightly above the center
    const faceCenterY = y + height / 2;
    const targetY = faceCenterY - (height * 0.8);

    const xPercent = (faceCenterX / imgWidth) * 100;
    const yPercent = (targetY / imgHeight) * 100;

    // Clamp values so we don't go out of bounds (keep between 20% and 80% for X, 0% and 60% for Y)
    const clampedX = Math.max(20, Math.min(80, xPercent));
    const clampedY = Math.max(0, Math.min(60, yPercent));

    return { 
      position: `${Math.round(clampedX)}% ${Math.round(clampedY)}%`,
      confidence: detection.score
    };

  } catch (err) {
    console.error("Error during face detection", err);
    return { position: "center 15%", confidence: 0 };
  }
}
