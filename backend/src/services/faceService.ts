import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// We do NOT use the canvas monkeyPatch here to avoid native module blocks.

let modelsLoaded = false;

/**
 * Loads the face-api models from the disk.
 * Uses the pure JS TensorFlow.js backend.
 */
export const loadModels = async () => {
  if (modelsLoaded) return;

  const modelPath = path.isAbsolute(config.faceModelsDir)
    ? config.faceModelsDir
    : path.join(process.cwd(), config.faceModelsDir);

  if (!fs.existsSync(modelPath)) {
    console.error(`Model path not found: ${modelPath}`);
    return;
  }

  try {
    // vladmandic/face-api uses loadFromDisk which works in Node.js
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    modelsLoaded = true;
    console.log('Face-api models loaded successfully (Native-less mode)');
  } catch (error) {
    console.error('Error loading face-api models:', error);
  }
};

/**
 * Decodes an image file using Jimp (pure JS) and converts it to a 3D Tensor.
 */
const decodeImage = async (imagePath: string): Promise<tf.Tensor3D | null> => {
  try {
    const image = await Jimp.read(imagePath);
    const { width, height } = image.bitmap;
    const data = image.bitmap.data;

    // Convert Jimp buffer (RGBA) to RGB Int32Array
    const numPixels = width * height;
    const values = new Int32Array(numPixels * 3);

    for (let i = 0; i < numPixels; i++) {
      values[i * 3 + 0] = data[i * 4 + 0]; // R
      values[i * 3 + 1] = data[i * 4 + 1]; // G
      values[i * 3 + 2] = data[i * 4 + 2]; // B
    }

    // Create tensor from pixel values
    return tf.tensor3d(values, [height, width, 3], 'int32');
  } catch (error) {
    console.error('Error decoding image with Jimp:', error);
    return null;
  }
};

/**
 * Generates a 128D face embedding from an image.
 */
export const generateEmbedding = async (imagePath: string): Promise<number[] | null> => {
  if (!modelsLoaded) await loadModels();

  const tensor = await decodeImage(imagePath);
  if (!tensor) return null;

  try {
    // Detect face and compute descriptor using the tensor
    // @ts-ignore
    const detections = await faceapi
      .detectSingleFace(tensor)
      .withFaceLandmarks()
      .withFaceDescriptor();

    tf.dispose(tensor); // Always clean up tensor memory

    if (!detections) {
      console.warn('No face detected in the image');
      return null;
    }

    return Array.from(detections.descriptor);
  } catch (error) {
    console.error('Error generating embedding:', error);
    tf.dispose(tensor);
    return null;
  }
};

/**
 * Compares a captured face image against a stored embedding.
 */
export const compareFaces = async (
  capturedImagePath: string,
  storedEmbedding: number[]
): Promise<boolean> => {
  if (!modelsLoaded) await loadModels();

  const capturedEmbedding = await generateEmbedding(capturedImagePath);
  if (!capturedEmbedding) return false;

  const distance = faceapi.euclideanDistance(capturedEmbedding, storedEmbedding);
  // Default threshold for face-api.js is 0.6
  return distance < 0.6;
};
