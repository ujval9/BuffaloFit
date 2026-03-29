// api/clothes.ts
import client from './client';
import { ClothingItem, ClothingItemCreate } from '../types';

export const fetchClothes = async (): Promise<ClothingItem[]> => {
  const { data } = await client.get('/api/clothes');
  return data;
};

export const createClothingItem = async (item: ClothingItemCreate): Promise<ClothingItem> => {
  const { data } = await client.post('/api/clothes', item);
  return data;
};

export const updateClothingItem = async (
  id: number,
  updates: Partial<ClothingItem>
): Promise<ClothingItem> => {
  const { data } = await client.patch(`/api/clothes/${id}`, updates);
  return data;
};

export const deleteClothingItem = async (id: number): Promise<void> => {
  await client.delete(`/api/clothes/${id}`);
};

// Move item to a new location (closet → washer → dryer)
export const moveItem = async (
  id: number,
  location: 'closet' | 'washer' | 'dryer'
): Promise<ClothingItem> => {
  const updates: Partial<ClothingItem> = { location };
  if (location === 'washer') {
    updates.is_wet = true;
    updates.is_clean = false;
  }
  return updateClothingItem(id, updates);
};
