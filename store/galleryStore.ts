import { create } from 'zustand';
import { ImageTemplate } from '@/types';

interface GalleryStore {
  images: ImageTemplate[];
  selectedCategory: string;
  searchQuery: string;
  setImages: (images: ImageTemplate[]) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useGalleryStore = create<GalleryStore>((set) => ({
  images: [],
  selectedCategory: 'all',
  searchQuery: '',
  setImages: (images) => set({ images }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
