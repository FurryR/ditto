/**
 * Web Worker for Real-ESRGAN Image Upscaling
 * Runs heavy computation off the main thread
 */

import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime for Web Worker environment
ort.env.wasm.numThreads = 16; // Fixed to 16 threads
ort.env.wasm.simd = true;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';

/**
 * Detect available execution providers with GPU acceleration in Worker
 */
async function detectExecutionProviders(): Promise<string[]> {
  const providers: string[] = [];

  // Check WebGPU support (preferred)
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (adapter) {
        providers.push('webgpu');
        console.log('[Worker] WebGPU available for acceleration');
      }
    } catch (e) {
      console.log('[Worker] WebGPU not available:', e);
    }
  }

  // Check WebGL support (fallback)
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(1, 1);
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        providers.push('webgl');
        console.log('[Worker] WebGL available for acceleration');
      }
    } catch (e) {
      console.log('[Worker] WebGL not available:', e);
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

interface WorkerMessage {
  type: 'upscale' | 'loadModel';
  payload?: any;
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error' | 'modelLoaded';
  payload?: any;
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

  console.log('[Worker] calcRenderingParams input:', {
    imageWidth,
    imageHeight,
    scale,
    offset,
    tileSize,
  });

  const input_offset = Math.ceil(offset / scale);
  const input_blend_size = Math.ceil(BLEND_SIZE / scale);
  const input_tile_step = tileSize - (input_offset * 2 + input_blend_size);
  const output_tile_step = input_tile_step * scale;

  if (input_tile_step <= 0) {
    throw new Error(
      `Invalid tile configuration: input_tile_step=${input_tile_step}. Tile size (${tileSize}) is too small for offset (${offset}) and blend size (${BLEND_SIZE}).`
    );
  }

  const y_h = imageHeight * scale;
  const y_w = imageWidth * scale;

  let h_blocks = 0;
  let input_h = 0;
  while (input_h < imageHeight + input_offset * 2) {
    input_h = h_blocks * input_tile_step + tileSize;
    h_blocks++;
    if (h_blocks > 1000) {
      throw new Error(
        `Too many height blocks (${h_blocks}). Image may be too large or tile configuration is invalid.`
      );
    }
  }

  let w_blocks = 0;
  let input_w = 0;
  while (input_w < imageWidth + input_offset * 2) {
    input_w = w_blocks * input_tile_step + tileSize;
    w_blocks++;
    if (w_blocks > 1000) {
      throw new Error(
        `Too many width blocks (${w_blocks}). Image may be too large or tile configuration is invalid.`
      );
    }
  }

  const pad: [number, number, number, number] = [
    input_offset,
    input_w - (imageWidth + input_offset),
    input_offset,
    input_h - (imageHeight + input_offset),
  ];

  const y_buffer_h = input_h * scale;
  const y_buffer_w = input_w * scale;

  console.log('[Worker] calcRenderingParams:', {
    input: { imageWidth, imageHeight, scale, offset, tileSize },
    intermediate: { input_offset, input_blend_size, input_tile_step, output_tile_step },
    blocks: { h_blocks, w_blocks, input_h, input_w },
    output: { y_h, y_w, y_buffer_h, y_buffer_w },
    pad,
    bufferSize: 3 * y_buffer_h * y_buffer_w,
    bufferBytes: 3 * y_buffer_h * y_buffer_w * 4,
  });

  return {
    y_h,
    y_w,
    input_offset,
    input_blend_size,
    input_tile_step,
    output_tile_step,
    h_blocks,
    w_blocks,
    y_buffer_h,
    y_buffer_w,
    pad,
  };
}

/**
 * Convert RGBA ImageData to RGB tensor (CHW format, 0.0-1.0 range)
 */
function imageDataToTensor(width: number, height: number, data: Uint8ClampedArray): ort.Tensor {
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
 * Convert RGB tensor to RGBA ImageData buffer
 */
function tensorToImageDataBuffer(
  tensor: ort.Tensor,
  width: number,
  height: number
): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(height * width * 4);
  rgba.fill(255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const j = y * width + x;
      const i = y * width * 4 + x * 4;
      rgba[i] = Math.min(255, Math.max(0, (tensor.data[j] as number) * 255.0 + 0.49999));
      rgba[i + 1] = Math.min(
        255,
        Math.max(0, (tensor.data[j + height * width] as number) * 255.0 + 0.49999)
      );
      rgba[i + 2] = Math.min(
        255,
        Math.max(0, (tensor.data[j + 2 * height * width] as number) * 255.0 + 0.49999)
      );
    }
  }

  return rgba;
}

/**
 * Crop a tile from a tensor (supports both BCHW and CHW formats)
 */
function cropTensor(
  tensor: ort.Tensor,
  x: number,
  y: number,
  width: number,
  height: number
): ort.Tensor {
  const dims = tensor.dims as number[];

  if (dims.length === 4) {
    // BCHW format: [B, C, H, W]
    const [B, C, H, W] = dims;
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
  } else if (dims.length === 3) {
    // CHW format: [C, H, W]
    const [C, H, W] = dims;
    const roi = new Float32Array(C * height * width);

    let idx = 0;
    for (let c = 0; c < C; c++) {
      const ci = c * H * W;
      for (let h = y; h < y + height; h++) {
        const hi = ci + h * W;
        for (let w = x; w < x + width; w++) {
          roi[idx++] = tensor.data[hi + w] as number;
        }
      }
    }

    return new ort.Tensor('float32', roi, [C, height, width]);
  } else {
    throw new Error(`Unsupported tensor format: ${dims.length} dimensions`);
  }
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
        // Use smooth transition that doesn't reach 0 at edges
        const distTop = i;
        const distBottom = filterSize - 1 - i;
        const distLeft = j;
        const distRight = filterSize - 1 - j;

        const minDist = Math.min(distTop, distBottom, distLeft, distRight);

        if (minDist < BLEND_SIZE) {
          // Ensure weight is never 0 by using (minDist + 1) / (BLEND_SIZE + 1)
          // This gives weights from ~0.059 to 0.941 at blend boundaries
          weight = (minDist + 1.0) / (BLEND_SIZE + 1.0);
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

    console.log('[Worker] SeamBlendingAccumulator constructor:', {
      y_buffer_h: params.y_buffer_h,
      y_buffer_w: params.y_buffer_w,
      scale: config.scale,
      offset: config.offset,
      tileSize: config.tileSize,
    });

    const bufferSize = 3 * params.y_buffer_h * params.y_buffer_w;

    console.log('[Worker] Calculated bufferSize:', bufferSize, 'bytes:', bufferSize * 4);

    // Validate buffer size before allocation
    const MAX_BUFFER_SIZE = Math.floor(2 ** 30 / 3);
    if (bufferSize > MAX_BUFFER_SIZE || bufferSize < 0) {
      console.error('[Worker] Buffer size validation failed:', {
        bufferSize,
        MAX_BUFFER_SIZE,
        y_buffer_h: params.y_buffer_h,
        y_buffer_w: params.y_buffer_w,
      });
      throw new Error(
        `Buffer size too large or invalid: ${bufferSize} elements (max: ${MAX_BUFFER_SIZE})`
      );
    }

    this.pixels = new Float32Array(bufferSize);
    this.weights = new Float32Array(bufferSize);

    this.blendFilter = createSeamBlendingFilter(config.scale, config.offset, config.tileSize);
    console.log('[Worker] BlendFilter shape:', this.blendFilter.dims);
  }

  update(tileTensor: ort.Tensor, tileRow: number, tileCol: number): ort.Tensor {
    // Matches SeamBlending.update() from sample.js
    // Handle both BCHW [1,3,H,W] and CHW [3,H,W] formats
    const tileDims = tileTensor.dims as number[];
    let C: number, H: number, W: number;

    if (tileDims.length === 4) {
      // BCHW format: [1, 3, H, W]
      [, C, H, W] = tileDims;
    } else {
      // CHW format: [3, H, W]
      [C, H, W] = tileDims;
    }

    const blendDims = this.blendFilter.dims as number[];
    const [blendC, blendH, blendW] = blendDims;

    if (tileRow === 0 && tileCol === 0) {
      console.log('[Worker] First tile update:', {
        tileDims: `${C}x${H}x${W}`,
        blendFilterDims: `${blendC}x${blendH}x${blendW}`,
        stepSize: this.params.output_tile_step,
      });
    }

    if (H !== blendH || W !== blendW) {
      console.error('[Worker] Size mismatch!', {
        tileSize: `${H}x${W}`,
        blendFilterSize: `${blendH}x${blendW}`,
      });
      throw new Error(
        `Tile size (${H}x${W}) does not match blend filter size (${blendH}x${blendW})`
      );
    }

    const HW = H * W;
    const bufferH = this.params.y_buffer_h;
    const bufferW = this.params.y_buffer_w;
    const bufferHW = bufferH * bufferW;
    const stepSize = this.params.output_tile_step;

    const hI = stepSize * tileRow;
    const wI = stepSize * tileCol;

    // Create output tensor with CHW format
    const output = new Float32Array(C * H * W);

    for (let c = 0; c < C; c++) {
      for (let i = 0; i < H; i++) {
        for (let j = 0; j < W; j++) {
          // Access tile data in CHW format (skip batch dimension if present)
          const tileIndex = c * HW + i * W + j;
          const bufferIndex = c * bufferHW + (hI + i) * bufferW + (wI + j);

          const oldWeight = this.weights[bufferIndex];
          const blendWeight = (this.blendFilter.data as Float32Array)[tileIndex];
          const nextWeight = oldWeight + blendWeight;

          // Incremental weighted average (key difference from cumulative approach)
          // Handle edge case when nextWeight is 0 or very small
          if (nextWeight > 1e-8) {
            const oldWeightNorm = oldWeight / nextWeight;
            const newWeightNorm = 1.0 - oldWeightNorm;

            this.pixels[bufferIndex] =
              this.pixels[bufferIndex] * oldWeightNorm +
              (tileTensor.data as Float32Array)[tileIndex] * newWeightNorm;
          } else {
            // If total weight is effectively 0, just use the new value
            this.pixels[bufferIndex] = (tileTensor.data as Float32Array)[tileIndex];
          }
          this.weights[bufferIndex] += blendWeight;

          output[tileIndex] = this.pixels[bufferIndex];
        }
      }
    }

    // Return in CHW format [C, H, W]
    return new ort.Tensor('float32', output, [C, H, W]);
  }

  getResult(): ort.Tensor {
    // Return the accumulated pixels buffer directly
    // The incremental weighted average in update() already normalized the values
    const bufferH = this.params.y_buffer_h;
    const bufferW = this.params.y_buffer_w;

    // Return pixels directly (already normalized by update())
    return new ort.Tensor('float32', this.pixels, [3, bufferH, bufferW]);
  }
}

let session: ort.InferenceSession | null = null;

/**
 * Load ONNX model
 */
async function loadModel(modelBuffer: ArrayBuffer): Promise<void> {
  const providers = await detectExecutionProviders();
  console.log('[Worker] Using execution providers:', providers);

  session = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: providers as any,
  });

  const response: WorkerResponse = {
    type: 'modelLoaded',
  };
  self.postMessage(response);
}

/**
 * Perform upscaling
 */
async function upscale(
  width: number,
  height: number,
  imageData: Uint8ClampedArray,
  config: UpscaleConfig
): Promise<void> {
  if (!session) {
    throw new Error('Model not loaded');
  }

  // Validate input dimensions
  const MAX_DIMENSION = 4096; // Maximum safe dimension
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(
      `Image too large. Maximum dimension is ${MAX_DIMENSION}px, got ${width}x${height}`
    );
  }

  const outputWidth = width * config.scale;
  const outputHeight = height * config.scale;

  // Check if output will exceed memory limits
  // Float32Array max length is ~2^30 elements, we need 3 channels
  const maxBufferSize = Math.floor(2 ** 30 / 3);
  if (outputWidth * outputHeight > maxBufferSize) {
    throw new Error(
      `Output image would be too large (${outputWidth}x${outputHeight}). Please use a smaller input image.`
    );
  }

  // Calculate rendering parameters
  const params = calcRenderingParams(width, height, config);

  console.log(`[Worker] Rendering params:`, {
    h_blocks: params.h_blocks,
    w_blocks: params.w_blocks,
    input_tile_step: params.input_tile_step,
    output_tile_step: params.output_tile_step,
    y_buffer: [params.y_buffer_h, params.y_buffer_w],
    pad: params.pad,
  });

  // Convert to tensor and apply padding
  let inputTensor = imageDataToTensor(width, height, imageData);
  console.log(`[Worker] Input tensor shape before padding: ${inputTensor.dims}`);

  inputTensor = reflectionPad(
    inputTensor,
    params.pad[0],
    params.pad[1],
    params.pad[2],
    params.pad[3]
  );

  console.log(`[Worker] Input tensor shape after padding: ${inputTensor.dims}`);

  // Create seam blending accumulator
  const accumulator = new SeamBlendingAccumulator(params, config);

  // Process tiles
  const totalTiles = params.h_blocks * params.w_blocks;
  let processedTiles = 0;

  for (let h = 0; h < params.h_blocks; h++) {
    for (let w = 0; w < params.w_blocks; w++) {
      const tileX = w * params.input_tile_step;
      const tileY = h * params.input_tile_step;

      // Crop tile
      const tileTensor = cropTensor(inputTensor, tileX, tileY, config.tileSize, config.tileSize);

      console.log(
        `[Worker] Processing tile ${h},${w}: input shape ${tileTensor.dims}, size ${tileTensor.data.length}`
      );

      // Run inference
      const startTime = performance.now();
      const outputs = await session.run({ x: tileTensor });
      const inferenceTime = performance.now() - startTime;
      const outputTensor = outputs.y;

      console.log(
        `[Worker] Inference took ${inferenceTime.toFixed(2)}ms, output shape ${outputTensor.dims}`
      );

      // Accumulate result with seam blending
      accumulator.update(outputTensor, h, w);

      processedTiles++;

      // Send progress update
      const progressResponse: WorkerResponse = {
        type: 'progress',
        payload: {
          current: processedTiles,
          total: totalTiles,
          percentage: Math.round((processedTiles / totalTiles) * 100),
        },
      };
      self.postMessage(progressResponse);
    }
  }

  // Get final result
  console.log('[Worker] Getting final result from accumulator...');
  const resultTensor = accumulator.getResult();
  console.log(
    '[Worker] Result tensor shape:',
    resultTensor.dims,
    'data length:',
    resultTensor.data.length
  );

  // Crop to final size (remove padding)
  console.log('[Worker] Cropping to final size:', {
    x: params.input_offset * config.scale,
    y: params.input_offset * config.scale,
    width: params.y_w,
    height: params.y_h,
  });
  const finalTensor = cropTensor(
    resultTensor,
    params.input_offset * config.scale,
    params.input_offset * config.scale,
    params.y_w,
    params.y_h
  );
  console.log(
    '[Worker] Final tensor shape:',
    finalTensor.dims,
    'data length:',
    finalTensor.data.length
  );

  // Convert back to ImageData buffer
  console.log('[Worker] Converting to ImageData buffer...');
  const resultBuffer = tensorToImageDataBuffer(finalTensor, params.y_w, params.y_h);
  console.log('[Worker] Result buffer length:', resultBuffer.length);

  // Send complete result
  const completeResponse: WorkerResponse = {
    type: 'complete',
    payload: {
      width: params.y_w,
      height: params.y_h,
      data: resultBuffer,
    },
  };
  (self as any).postMessage(completeResponse, { transfer: [resultBuffer.buffer] });
}

// Worker message handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  try {
    if (type === 'loadModel') {
      await loadModel(payload.modelBuffer);
    } else if (type === 'upscale') {
      await upscale(payload.width, payload.height, payload.imageData, payload.config);
    }
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type: 'error',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    self.postMessage(errorResponse);
  }
};
