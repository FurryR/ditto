'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, X, Wand2, Download, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Template } from '@/types';
import { useUserStore } from '@/store/userStore';
import { createClient } from '@/lib/supabase/client';
import { upscaleImage, type UpscaleProgress } from '@/lib/esrgan/upscaler';

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template;
}

interface CharacterImage {
  id: string;
  file: File;
  preview: string;
}

export function UseTemplateDialog({ open, onOpenChange, template }: UseTemplateDialogProps) {
  const t = useTranslations('useTemplateDialog');
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const { user } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    const checkOpenRouterKey = async () => {
      if (!user?.id) {
        setHasOpenRouterKey(false);
        setCheckingKey(false);
        return;
      }

      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setHasOpenRouterKey(!!data.apiSettings?.openrouter_key);
        }
      } catch (error) {
        console.error('Failed to check OpenRouter key:', error);
      } finally {
        setCheckingKey(false);
      }
    };

    if (open) {
      checkOpenRouterKey();
    }
  }, [open, user]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newImage: CharacterImage = {
        id: `char-${Date.now()}`,
        file,
        preview: URL.createObjectURL(file),
      };
      setCharacterImages([...characterImages, newImage]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setCharacterImages(characterImages.filter((img) => img.id !== id));
  };

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error(t('toast.pleaseSignIn'));
      return;
    }

    if (!hasOpenRouterKey) {
      toast.error(t('toast.openRouterNotConnected'));
      return;
    }

    if (characterImages.length === 0) {
      toast.error(t('toast.uploadAtLeastOne'));
      return;
    }

    setIsUploading(true);
    try {
      // Upload character images first
      const uploadViaApi = async (file: File, prefix: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prefix', prefix);
        const res = await fetch('/api/uploads', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('toast.uploadFailed'));
        }
        const data = await res.json();
        return data.url as string;
      };

      const characterUrls: string[] = [];
      for (const img of characterImages) {
        const url = await uploadViaApi(img.file, 'character');
        characterUrls.push(url);
      }

      setIsUploading(false);
      setIsGenerating(true);

      // Call generate API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          characterImages: characterUrls,
          additionalPrompt: additionalPrompt.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('toast.generateFailed'));
      }

      const data = await response.json();
      setGeneratedImage(data.generatedImageUrl);
      toast.success(t('toast.generateDone'));
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : t('toast.generateFailed'));
    } finally {
      setIsUploading(false);
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImage) return;
    if (!user?.id) {
      toast.error(t('toast.pleaseSignIn'));
      return;
    }

    setIsSaving(true);

    try {
      const uploadViaApi = async (file: File, prefix: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prefix', prefix);
        const res = await fetch('/api/uploads', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('toast.uploadFailed'));
        }
        const data = await res.json();
        return data.url as string;
      };

      // Upload only the final generated image
      const generatedBlob = await fetch(generatedImage).then((res) => res.blob());
      const generatedFile = new File([generatedBlob], `generated-${Date.now()}.png`, {
        type: generatedBlob.type || 'image/png',
      });
      const generatedUrl = await uploadViaApi(generatedFile, 'generated');

      // Call /api/posts to create work via TypeORM
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          imageUrl: generatedUrl,
          title: t('workTitle', { name: template.name }),
          promptUsed: template.promptTemplate,
          additionalPrompt: additionalPrompt || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('toast.saveFailed'));
      }

      toast.success(t('toast.saved'));
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ditto-${Date.now()}.png`;
    link.click();
    toast.success(t('toast.startDownload'));
  };

  const handleUpscale = async () => {
    if (!generatedImage) return;

    setIsUpscaling(true);
    setUpscaleProgress(0);

    try {
      // Load the image into a canvas
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = generatedImage;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(img, 0, 0);

      // Check image size before upscaling
      const MAX_DIMENSION = 4096;
      if (canvas.width > MAX_DIMENSION || canvas.height > MAX_DIMENSION) {
        throw new Error(
          `Image is too large for upscaling. Maximum dimension is ${MAX_DIMENSION}px, but image is ${canvas.width}x${canvas.height}.`
        );
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Upscale with progress tracking (runs in Web Worker)
      const upscaledData = await upscaleImage(
        imageData,
        '/api/models/esrgan',
        { scale: 2, offset: 16, tileSize: 256 },
        (progress: UpscaleProgress) => {
          setUpscaleProgress(progress.percentage);
        }
      );

      // Convert result to data URL
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = upscaledData.width;
      resultCanvas.height = upscaledData.height;
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Failed to get result canvas context');
      resultCtx.putImageData(upscaledData, 0, 0);
      const upscaledDataUrl = resultCanvas.toDataURL('image/png');

      setUpscaledImage(upscaledDataUrl);
      setGeneratedImage(upscaledDataUrl);
      toast.success(t('toast.upscaleDone'));
    } catch (error) {
      console.error('Upscale error:', error);
      toast.error(error instanceof Error ? error.message : t('toast.upscaleFailed'));
    } finally {
      setIsUpscaling(false);
      setUpscaleProgress(0);
    }
  };

  const resetDialog = () => {
    setCharacterImages([]);
    setAdditionalPrompt('');
    setGeneratedImage(null);
    setUpscaledImage(null);
    setUpscaleProgress(0);
  };

  const canAddMoreImages = characterImages.length < template.numCharacters;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetDialog();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title', { name: template.name })}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Character Images Upload */}
          <div className="space-y-3">
            <Label>
              {t('characterImages', {
                current: characterImages.length,
                total: template.numCharacters,
              })}
            </Label>
            <div className="flex flex-wrap gap-2">
              {characterImages.map((image) => (
                <div
                  key={image.id}
                  className="border-border relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2"
                >
                  <Image src={image.preview} alt="Character" fill className="object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {canAddMoreImages && (
                <label
                  htmlFor="character-upload"
                  className="border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50 flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <Upload className="text-muted-foreground h-6 w-6" />
                  <input
                    id="character-upload"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageAdd}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Additional Prompt */}
          <div className="space-y-2">
            <Label htmlFor="additional-prompt">{t('additionalPrompt')}</Label>
            <Textarea
              id="additional-prompt"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder={t('additionalPromptPlaceholder')}
              rows={3}
            />
          </div>

          {/* OpenRouter Warning */}
          {!checkingKey && !hasOpenRouterKey && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-4 text-sm dark:bg-yellow-950">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {t('toast.openRouterNotConnected')}
                </p>
                <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                  {t('toast.connectOpenRouterPrompt')}
                </p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!generatedImage && (
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={
                characterImages.length === 0 ||
                isUploading ||
                isGenerating ||
                !hasOpenRouterKey ||
                checkingKey
              }
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {t('uploading')}
                </>
              ) : isGenerating ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {t('generateImage')}
                </>
              )}
            </Button>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <div className="space-y-3">
              <Label>{t('result')}</Label>
              <div className="overflow-hidden rounded-lg border-2">
                <div className="relative aspect-[4/3]">
                  <Image src={generatedImage} alt="Generated" fill className="object-cover" />
                </div>
              </div>

              {/* Upscale Progress */}
              {isUpscaling && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('upscaling')}</span>
                    <span>{upscaleProgress}%</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${upscaleProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!upscaledImage && !isUpscaling && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleUpscale}
                    disabled={isUpscaling}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('upscale')}
                  </Button>
                )}
                <Button type="button" variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('download')}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving || isUpscaling}
                >
                  {isSaving ? t('saving') : t('saveToMyWorks')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
