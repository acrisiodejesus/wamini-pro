import apiClient from '../client';
import type { Product, CreateProductData } from '../types';

export const productsService = {
  /**
   * Get all products with optional filters
   */
  async getProducts(filters?: { category?: string; search?: string }): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products', {
        params: filters
      });
      
      const products = Array.isArray(response.data) ? response.data : [];
      return products;
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Create new product
   */
  async createProduct(data: CreateProductData): Promise<{ message: string; product_id: number }> {
    try {
      const response = await apiClient.post<{ message: string; product_id: number }>('/products', data);
      console.log('Create Product API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/products/${id}`);
      console.log('Delete Product API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};

