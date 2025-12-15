"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, Plus, Wand2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AI_MODELS } from '@/lib/ai-models';

interface CharacterImage {
  id: string;
  file: File;
  preview: string;
}

const LICENSE_TYPES = [
  { id: 'CC-0', name: 'CC-0 (Public Domain)' },
  { id: 'CC-BY-4.0', name: 'CC-BY-4.0' },
  { id: 'CC-BY-SA-4.0', name: 'CC-BY-SA-4.0' },
  { id: 'CC-BY-NC-4.0', name: 'CC-BY-NC-4.0' },
  { id: 'CC-BY-NC-SA-4.0', name: 'CC-BY-NC-SA-4.0' },
  { id: 'CC-BY-ND-4.0', name: 'CC-BY-ND-4.0' },
];

function SortableImage({ image, onRemove }: { image: CharacterImage; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-border"
    >
      <div {...attributes} {...listeners} className="h-full w-full cursor-move">
        <Image src={image.preview} alt="Character" fill className="object-cover" />
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="absolute right-1 top-1 h-6 w-6 rounded-full"
        onClick={handleRemove}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function StudioPage() {
  const t = useTranslations('studio');
  const { user } = useUserStore();
  const router = useRouter();
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promptTemplate: '',
    category: 'anime',
    tags: '',
    modelName: 'google/gemini-2.5-flash-image',
    numCharacters: 1,
    licenseType: 'CC-BY-NC-SA-4.0',
    additionalPrompt: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBaseImage(file);
      setBaseImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCharacterImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveCharacterImage = (id: string) => {
    setCharacterImages(characterImages.filter((img) => img.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCharacterImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    // TODO: Implement actual generation logic
    setTimeout(() => {
      setGeneratedPreview(baseImagePreview || '/example-template.png');
      setIsGenerating(false);
    }, 2000);
  };

  const uploadToStorage = async (file: File, prefix: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', prefix);
    const res = await fetch('/api/uploads', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || t('uploadFailed'));
    }
    const data = await res.json();
    return data.url as string;
  };

  const handleSubmit = async (isPublished: boolean) => {
    if (!user?.id) {
      toast.error(t('pleaseSignIn'));
      return;
    }
    if (!baseImage) {
      toast.error(t('pleaseUploadBaseImage'));
      return;
    }
    if (!formData.name || !formData.promptTemplate) {
      toast.error(t('pleaseFillRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = await uploadToStorage(baseImage, 'base');
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          baseImageUrl: baseUrl,
          coverImageUrl: baseUrl,
          promptTemplate: formData.promptTemplate,
          category: formData.category,
          tags,
          modelName: formData.modelName,
          numCharacters: formData.numCharacters,
          licenseType: formData.licenseType,
          licenseRestrictions: [],
          isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('submitFailed'));
      }

      const data = await res.json();
      toast.success(isPublished ? t('templatePublished') : t('draftSaved'));
      if (isPublished && data.id) {
        router.push(`/template/${data.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('submitFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const canAddMoreImages = characterImages.length < formData.numCharacters;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">{t('title')}</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Sidebar - Settings */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('basicInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('templateName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('templateNamePlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">{t('tags')}</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="anime, fantasy, furry"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('aiSettings')}</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="model">{t('baseModel')}</Label>
                  <Select
                    value={formData.modelName}
                    onValueChange={(value) => setFormData({ ...formData, modelName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numCharacters">{t('numCharacters')}</Label>
                  <Select
                    value={formData.numCharacters.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, numCharacters: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {t('charactersCount', { num })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="promptTemplate">{t('promptTemplate')}</Label>
                  <Textarea
                    id="promptTemplate"
                    value={formData.promptTemplate}
                    onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                    placeholder={t('promptPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('baseImage')}</h2>
              {!baseImagePreview ? (
                <label
                  htmlFor="base-image-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">{t('uploadBaseImage')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                  <input
                    id="base-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleBaseImageChange}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image src={baseImagePreview} alt="Base" fill className="object-cover" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setBaseImage(null);
                      setBaseImagePreview(null);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('replaceImage')}
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('license')}</h2>
              <Select
                value={formData.licenseType}
                onValueChange={(value) => setFormData({ ...formData, licenseType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((license) => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('testCharacterImages')}</h2>
              <div className="space-y-4">
                {/* Character Images - Horizontal sortable list */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <SortableContext
                      items={characterImages.map((img) => img.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {characterImages.map((image) => (
                        <SortableImage
                          key={image.id}
                          image={image}
                          onRemove={() => handleRemoveCharacterImage(image.id)}
                        />
                      ))}
                    </SortableContext>

                    {/* Add button */}
                    {canAddMoreImages && (
                      <label
                        htmlFor="character-image-upload"
                        className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50"
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                        <input
                          id="character-image-upload"
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleCharacterImageAdd}
                        />
                      </label>
                    )}
                  </div>
                </DndContext>

                <div className="text-sm text-muted-foreground">
                  {t('uploadedCount', { count: characterImages.length, total: formData.numCharacters })}
                  {canAddMoreImages && t('dragToReorder')}
                </div>

                {/* Additional Prompt */}
                <div>
                  <Label htmlFor="additionalPrompt">{t('additionalPrompt')}</Label>
                  <Textarea
                    id="additionalPrompt"
                    value={formData.additionalPrompt}
                    onChange={(e) => setFormData({ ...formData, additionalPrompt: e.target.value })}
                    placeholder={t('additionalPromptPlaceholder')}
                    rows={3}
                  />
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleGeneratePreview}
                    disabled={!baseImage || characterImages.length === 0 || isGenerating}
                    className="min-w-[200px]"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {t('generatePreview')}
                      </>
                    )}
                  </Button>
                </div>

                {/* Preview Frame */}
                {generatedPreview && (
                  <Card className="overflow-hidden border-2">
                    <div className="bg-muted p-4">
                      <h3 className="font-semibold">{t('previewTitle')}</h3>
                    </div>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={generatedPreview}
                        alt="Generated preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" size="lg" disabled={isSaving} onClick={() => handleSubmit(false)}>
                {isSaving ? t('saving') : t('saveDraft')}
              </Button>
              <Button
                size="lg"
                disabled={!baseImage || !formData.name || !formData.promptTemplate || isSaving}
                onClick={() => handleSubmit(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isSaving ? t('submitting') : t('publishTemplate')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
