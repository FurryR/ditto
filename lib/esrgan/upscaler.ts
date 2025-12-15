/**
 * Real-ESRGAN Image Upscaler
 * Adapted from nunif/waifu2x web implementation
 * Uses ONNX Runtime Web for client-side inference
 */

import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime WASM paths
if (typeof window !== 'undefined') {
  ort.env.wasm.numThreads = 16; // Fixed to 16 threads
  ort.env.wasm.simd = true;
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
}

/**
 * Detect available execution providers with GPU acceleration
 */
async function detectExecutionProviders(): Promise<string[]> {
  const providers: string[] = [];
  
  // Check WebGPU support (preferred)
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (adapter) {
        providers.push('webgpu');
        console.log('WebGPU available for acceleration');
      }
    } catch (e) {
      console.log('WebGPU not available:', e);
    }
  }
  
  // Check WebGL support (fallback)
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        providers.push('webgl');
        console.log('WebGL available for acceleration');
      }
    } catch (e) {
      console.log('WebGL not available:', e);
    }
  }
  
  // Always include WASM as fallback
  providers.push('wasm');
  
  return providers;
}

const BLEND_SIZE = 16;

interface UpscaleConfig {
  scale: number;
  offset: number;
  tileSize: number;
}

interface RenderingParams {
  y_h: number;
  y_w: number;
  input_offset: number;
  input_blend_size: number;
  input_tile_step: number;
  output_tile_step: number;
  h_blocks: number;
  w_blocks: number;
  y_buffer_h: number;
  y_buffer_w: number;
  pad: [number, number, number, number];
}

/**
 * Calculate rendering parameters for tiled inference
 */
function calcRenderingParams(
  imageWidth: number,
  imageHeight: number,
  config: UpscaleConfig
): RenderingParams {
  const { scale, offset, tileSize } = config;
  
  const input_offset = Math.ceil(offset / scale);
  const input_blend_size = Math.ceil(BLEND_SIZE / scale);
  const input_tile_step = tileSize - (input_offset * 2 + input_blend_size);
  const output_tile_step = input_tile_step * scale;

  const y_h = imageHeight * scale;
  const y_w = imageWidth * scale;

  let h_blocks = 0;
  let input_h = 0;
  while (input_h < imageHeight + input_offset * 2) {
    input_h = h_blocks * input_tile_step + tileSize;
    h_blocks++;
  }

  let w_blocks = 0;
  let input_w = 0;
  while (input_w < imageWidth + input_offset * 2) {
    input_w = w_blocks * input_tile_step + tileSize;
    w_blocks++;
  }

  const pad: [number, number, number, number] = [
    input_offset,
    input_w - (imageWidth + input_offset),
    input_offset,
    input_h - (imageHeight + input_offset),
  ];

  return {
    y_h,
    y_w,
    input_offset,
    input_blend_size,
    input_tile_step,
    output_tile_step,
    h_blocks,
    w_blocks,
    y_buffer_h: input_h * scale,
    y_buffer_w: input_w * scale,
    pad,
  };
}

/**
 * Convert RGBA ImageData to RGB tensor (CHW format, 0.0-1.0 range)
 */
function imageDataToTensor(imageData: ImageData): ort.Tensor {
  const { width, height, data } = imageData;
  const rgb = new Float32Array(height * width * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width * 4 + x * 4;
      const j = y * width + x;
      rgb[j] = data[i] / 255.0;
      rgb[j + height * width] = data[i + 1] / 255.0;
      rgb[j + 2 * height * width] = data[i + 2] / 255.0;
    }
  }

  return new ort.Tensor('float32', rgb, [1, 3, height, width]);
}

/**
 * Convert RGB tensor to RGBA ImageData
 */
function tensorToImageData(tensor: ort.Tensor, width: number, height: number): ImageData {
  const rgba = new Uint8ClampedArray(height * width * 4);
  rgba.fill(255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const j = y * width + x;
      const i = y * width * 4 + x * 4;
      rgba[i] = Math.min(255, Math.max(0, (tensor.data[j] as number) * 255.0 + 0.49999));
      rgba[i + 1] = Math.min(255, Math.max(0, (tensor.data[j + height * width] as number) * 255.0 + 0.49999));
      rgba[i + 2] = Math.min(255, Math.max(0, (tensor.data[j + 2 * height * width] as number) * 255.0 + 0.49999));
    }
  }

  return new ImageData(rgba, width, height);
}

/**
 * Crop a tile from a tensor
 */
function cropTensor(
  tensor: ort.Tensor,
  x: number,
  y: number,
  width: number,
  height: number
): ort.Tensor {
  const [B, C, H, W] = tensor.dims as number[];
  const roi = new Float32Array(B * C * height * width);
  
  let idx = 0;
  for (let b = 0; b < B; b++) {
    const bi = b * C * H * W;
    for (let c = 0; c < C; c++) {
      const ci = bi + c * H * W;
      for (let h = y; h < y + height; h++) {
        const hi = ci + h * W;
        for (let w = x; w < x + width; w++) {
          roi[idx++] = tensor.data[hi + w] as number;
        }
      }
    }
  }

  return new ort.Tensor('float32', roi, [B, C, height, width]);
}

/**
 * Apply reflection padding to tensor
 */
function reflectionPad(
  tensor: ort.Tensor,
  padLeft: number,
  padRight: number,
  padTop: number,
  padBottom: number
): ort.Tensor {
  const [B, C, H, W] = tensor.dims as number[];
  const newH = H + padTop + padBottom;
  const newW = W + padLeft + padRight;
  const padded = new Float32Array(B * C * newH * newW);

  for (let b = 0; b < B; b++) {
    for (let c = 0; c < C; c++) {
      for (let h = 0; h < newH; h++) {
        for (let w = 0; w < newW; w++) {
          let srcH = h - padTop;
          let srcW = w - padLeft;

          // Reflection padding logic
          if (srcH < 0) srcH = -srcH - 1;
          if (srcH >= H) srcH = 2 * H - srcH - 1;
          if (srcW < 0) srcW = -srcW - 1;
          if (srcW >= W) srcW = 2 * W - srcW - 1;

          srcH = Math.max(0, Math.min(H - 1, srcH));
          srcW = Math.max(0, Math.min(W - 1, srcW));

          const srcIdx = b * C * H * W + c * H * W + srcH * W + srcW;
          const dstIdx = b * C * newH * newW + c * newH * newW + h * newW + w;
          padded[dstIdx] = tensor.data[srcIdx] as number;
        }
      }
    }
  }

  return new ort.Tensor('float32', padded, [B, C, newH, newW]);
}

/**
 * Create seam blending filter
 */
function createSeamBlendingFilter(scale: number, offset: number, tileSize: number): ort.Tensor {
  const filterSize = tileSize * scale - offset * 2;
  const filter = new Float32Array(3 * filterSize * filterSize);
  
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < filterSize; i++) {
      for (let j = 0; j < filterSize; j++) {
        let weight = 1.0;
        
        // Apply blending at borders
        const distTop = i;
        const distBottom = filterSize - 1 - i;
        const distLeft = j;
        const distRight = filterSize - 1 - j;
        
        const minDist = Math.min(distTop, distBottom, distLeft, distRight);
        
        if (minDist < BLEND_SIZE) {
          weight = minDist / BLEND_SIZE;
        }
        
        const idx = c * filterSize * filterSize + i * filterSize + j;
        filter[idx] = weight;
      }
    }
  }
  
  return new ort.Tensor('float32', filter, [3, filterSize, filterSize]);
}

/**
 * Seam blending accumulator
 */
class SeamBlendingAccumulator {
  private pixels: Float32Array;
  private weights: Float32Array;
  private blendFilter: ort.Tensor;
  private params: RenderingParams;
  private config: UpscaleConfig;

  constructor(params: RenderingParams, config: UpscaleConfig) {
    this.params = params;
    this.config = config;
    
    const bufferSize = 3 * params.y_buffer_h * params.y_buffer_w;
    this.pixels = new Float32Array(bufferSize);
    this.weights = new Float32Array(bufferSize);
    
    this.blendFilter = createSeamBlendingFilter(config.scale, config.offset, config.tileSize);
  }

  update(tileTensor: ort.Tensor, tileRow: number, tileCol: number): void {
    const [C, H, W] = this.blendFilter.dims as number[];
    const bufferH = this.params.y_buffer_h;
    const bufferW = this.params.y_buffer_w;
    const stepSize = this.params.output_tile_step;
    
    const startH = stepSize * tileRow;
    const startW = stepSize * tileCol;

    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < H; i++) {
        for (let j = 0; j < W; j++) {
          const h = startH + i;
          const w = startW + j;
          
          if (h >= bufferH || w >= bufferW) continue;
          
          const filterIdx = c * H * W + i * W + j;
          const tileIdx = c * H * W + i * W + j;
          const bufferIdx = c * bufferH * bufferW + h * bufferW + w;
          
          const weight = this.blendFilter.data[filterIdx] as number;
          const value = tileTensor.data[tileIdx] as number;
          
          this.pixels[bufferIdx] += value * weight;
          this.weights[bufferIdx] += weight;
        }
      }
    }
  }

  getResult(): ort.Tensor {
    const bufferH = this.params.y_buffer_h;
    const bufferW = this.params.y_buffer_w;
    const result = new Float32Array(3 * bufferH * bufferW);
    
    for (let i = 0; i < result.length; i++) {
      result[i] = this.weights[i] > 0 ? this.pixels[i] / this.weights[i] : 0;
    }
    
    return new ort.Tensor('float32', result, [3, bufferH, bufferW]);
  }
}

export interface UpscaleProgress {
  current: number;
  total: number;
  percentage: number;
}

export type ProgressCallback = (progress: UpscaleProgress) => void;

/**
 * Wrapper for upscaling using Web Worker
 */
class UpscalerWorker {
  private worker: Worker | null = null;
  private modelLoaded = false;

  async initialize(modelPath: string): Promise<void> {
    if (this.worker) {
      return;
    }

    // Load model from cache or download
    const cachedBuffer = await this.loadModelFromCache(modelPath);
    
    // Create worker
    this.worker = new Worker(new URL('./upscaler.worker.ts', import.meta.url), {
      type: 'module',
    });

    // Wait for model to load in worker
    await new Promise<void>((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker not initialized'));
      
      const timeoutId = setTimeout(() => {
        reject(new Error('Model loading timeout'));
      }, 60000); // 60 second timeout

      this.worker.onmessage = (e) => {
        const { type } = e.data;
        if (type === 'modelLoaded') {
          clearTimeout(timeoutId);
          this.modelLoaded = true;
          resolve();
        } else if (type === 'error') {
          clearTimeout(timeoutId);
          reject(new Error(e.data.payload.message));
        }
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      // Send model to worker
      this.worker.postMessage({
        type: 'loadModel',
        payload: { modelBuffer: cachedBuffer },
      }, [cachedBuffer]);
    });
  }

  private async loadModelFromCache(modelPath: string): Promise<ArrayBuffer> {
    const cacheKey = `model_${modelPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Try to load from IndexedDB cache first
    try {
      const cachedBuffer = await getModelFromCache(cacheKey);
      if (cachedBuffer) {
        console.log('Loading model from IndexedDB cache...');
        return cachedBuffer;
      }
    } catch (err) {
      console.warn('Failed to load model from cache:', err);
    }
    
    // Download model
    console.log('Downloading model...');
    const response = await fetch(modelPath);
    const arrayBuffer = await response.arrayBuffer();
    
    // Cache the model to IndexedDB
    try {
      await saveModelToCache(cacheKey, arrayBuffer);
      console.log('Model cached to IndexedDB successfully');
    } catch (err) {
      console.warn('Failed to cache model:', err);
    }
    
    return arrayBuffer;
  }

  async upscale(
    imageData: ImageData,
    config: UpscaleConfig,
    onProgress?: ProgressCallback
  ): Promise<ImageData> {
    if (!this.worker || !this.modelLoaded) {
      throw new Error('Worker not initialized or model not loaded');
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker not initialized'));

      this.worker.onmessage = (e) => {
        const { type, payload } = e.data;
        
        if (type === 'progress' && onProgress) {
          onProgress(payload);
        } else if (type === 'complete') {
          const { width, height, data } = payload;
          const resultImageData = new ImageData(data, width, height);
          resolve(resultImageData);
        } else if (type === 'error') {
          reject(new Error(payload.message));
        }
      };

      this.worker.onerror = (error) => {
        reject(error);
      };

      // Send upscale request
      this.worker.postMessage({
        type: 'upscale',
        payload: {
          width: imageData.width,
          height: imageData.height,
          imageData: imageData.data,
          config,
        },
      }, [imageData.data.buffer]);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.modelLoaded = false;
    }
  }
}

let workerInstance: UpscalerWorker | null = null;

/**
 * IndexedDB helper for model storage
 */
const DB_NAME = 'esrgan_models';
const DB_VERSION = 1;
const STORE_NAME = 'models';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getModelFromCache(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to read from IndexedDB:', error);
    return null;
  }
}

async function saveModelToCache(key: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to save to IndexedDB:', error);
  }
}

/**
 * Upscale an image using Real-ESRGAN (Web Worker version)
 */
export async function upscaleImage(
  imageData: ImageData,
  modelPath: string,
  config: UpscaleConfig = { scale: 2, offset: 16, tileSize: 256 },
  onProgress?: ProgressCallback
): Promise<ImageData> {
  // Initialize worker if needed
  if (!workerInstance) {
    workerInstance = new UpscalerWorker();
    await workerInstance.initialize(modelPath);
  }

  return workerInstance.upscale(imageData, config, onProgress);
}

/**
 * Terminate the worker instance
 */
export function terminateUpscaler(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}

/**
 * Preload model (optional - model will be loaded automatically on first upscale)
 */
export async function preloadModel(modelPath: string): Promise<void> {
  if (!workerInstance) {
    workerInstance = new UpscalerWorker();
    await workerInstance.initialize(modelPath);
  }
}
