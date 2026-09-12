import apiClient from '../client';
import type {
  Negotiation,
  Message,
  CreateNegotiationData,
  SendMessageData,
  MessageResponse
} from '../types';

export const negotiationsService = {
  /**
   * Get all user negotiations
   */
  async getNegotiations(): Promise<Negotiation[]> {
    try {
      const response = await apiClient.get<Negotiation[]>('/negotiations');
      console.log('Negotiations API Response:', response.data);

      // Backend returns array directly
      const negotiations = Array.isArray(response.data) ? response.data : [];

      return negotiations;
    } catch (error: any) {
      console.error('Error fetching negotiations:', error);
      throw error;
    }
  },

  /**
   * Create new negotiation (start chat about a product/input/transport)
   */
  async createNegotiation(data: CreateNegotiationData): Promise<{ message: string; negotiation_id: number }> {
    try {
      const response = await apiClient.post<{ message: string; negotiation_id: number }>('/negotiations', data);
      console.log('Create Negotiation API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating negotiation:', error);
      throw error;
    }
  },

  /**
   * Get messages for a negotiation
   */
  async getMessages(negotiationId: number): Promise<Message[]> {
    try {
      const response = await apiClient.get<Message[]>(`/negotiations/${negotiationId}/messages`);
      console.log('Messages API Response:', response.data);

      // Backend returns array directly
      const messages = Array.isArray(response.data) ? response.data : [];

      return messages;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Send message in a negotiation
   */
  async sendMessage(negotiationId: number, data: SendMessageData): Promise<MessageResponse> {
    try {
      const response = await apiClient.post<MessageResponse>(
        `/negotiations/${negotiationId}/messages`,
        data
      );
      console.log('Send Message API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};

