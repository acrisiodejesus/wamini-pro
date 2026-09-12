import apiClient from '../client';
import type { Transport, CreateTransportData } from '../types';

export const transportsService = {
  /**
   * Get all transports
   */
  async listTransports(): Promise<Transport[]> {
    try {
      const response = await apiClient.get<Transport[]>('/transports');
      console.log('Transports API Response:', response.data);

      // Backend returns array directly
      const transports = Array.isArray(response.data) ? response.data : [];

      return transports;
    } catch (error: any) {
      console.error('Error fetching transports:', error);
      throw error;
    }
  },

  /**
   * Create new transport
   */
  async createTransport(data: CreateTransportData): Promise<{ message: string; transport_id: number }> {
    try {
      const response = await apiClient.post<{ message: string; transport_id: number }>('/transports', data);
      console.log('Create Transport API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating transport:', error);
      throw error;
    }
  },
};
