// api/classes.ts
import client from './client';
import { ClassSchedule, ClassScheduleCreate } from '../types';

export const fetchClasses = async (): Promise<ClassSchedule[]> => {
  const { data } = await client.get('/api/classes');
  return data;
};

export const createClass = async (cls: ClassScheduleCreate): Promise<ClassSchedule> => {
  const { data } = await client.post('/api/classes', cls);
  return data;
};

export const deleteClass = async (id: number): Promise<void> => {
  await client.delete(`/api/classes/${id}`);
};

export const updateClass = async (id: number, data: ClassScheduleCreate): Promise<ClassSchedule> => {
  const res = await client.patch(`/api/classes/${id}`, data);
  return res.data;
};
