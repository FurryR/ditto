// OpenRouter AI models configuration
export const AI_MODELS = [
  { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (Nano Banana)' },
  { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview (Nano Banana)' },
  { id: 'openai/gpt-5-image-mini', name: 'GPT-5 Image Mini' },
  { id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image Preview (Nano Banana)' },
  { id: 'black-forest-labs/flux.2-pro', name: 'FLUX.2 Pro' },
  { id: 'openai/gpt-5-image', name: 'GPT-5 Image' },
  { id: 'black-forest-labs/flux.2-flex', name: 'FLUX.2 Flex' },
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];

/**
 * Get model display name from model ID
 */
export function getModelName(modelId: string): string {
  const model = AI_MODELS.find(m => m.id === modelId);
  return model?.name || modelId;
}

/**
 * Get model ID from display name
 */
export function getModelId(modelName: string): string {
  const model = AI_MODELS.find(m => m.name === modelName);
  return model?.id || modelName;
}
