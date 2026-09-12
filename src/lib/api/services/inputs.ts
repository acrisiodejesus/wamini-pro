import apiClient from '../client';
import type { Input, CreateInputData } from '../types';

export const inputsService = {
  /**
   * Get all inputs
   */
  async listInputs(): Promise<Input[]> {
    try {
      const response = await apiClient.get<Input[]>('/inputs');
      console.log('Inputs API Response:', response.data);

      // Backend returns array directly
      const inputs = Array.isArray(response.data) ? response.data : [];

      return inputs;
    } catch (error: any) {
      console.error('Error fetching inputs:', error);
      throw error;
    }
  },

  /**
   * Create new input
   */
  async createInput(data: CreateInputData): Promise<{ message: string; input_id: number }> {
    try {
      const response = await apiClient.post<{ message: string; input_id: number }>('/inputs', data);
      console.log('Create Input API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating input:', error);
      throw error;
    }
  },
};
