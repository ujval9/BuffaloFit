// api/recommendation.ts
import client from './client';
import { RecommendationResponse, WeatherData } from '../types';

export const getRecommendation = async (
  desiredItemIds: number[],
  classId: number
): Promise<RecommendationResponse> => {
  const { data } = await client.post('/api/recommendation', {
    desired_item_ids: desiredItemIds,
    class_id: classId,
  });
  return data;
};

export const getCurrentWeather = async (): Promise<WeatherData> => {
  const { data } = await client.get('/api/weather');
  return data;
};
