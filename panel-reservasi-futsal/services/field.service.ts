import axiosInstance from '@/lib/axios';

export interface FieldPrice {
  dayType: 'WEEKDAY' | 'WEEKEND';
  startHour: number;
  endHour: number;
  price: number;
}

export interface CreateFieldPayload {
  venueId: string;
  name: string;
  type: string;
  isActive: boolean;
  lengthMeter: number;
  widthMeter: number;
  imageUrls: string[];
  prices: FieldPrice[];
}

export interface UpdateFieldPayload extends Partial<CreateFieldPayload> {
  id: string;
}

export interface FieldResponse {
  id: string;
  venueId: string;
  name: string;
  type: string;
  isActive: boolean;
  lengthMeter: number;
  widthMeter: number;
  imageUrls: string[];
  prices: FieldPrice[];
  images?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldListResponse {
  data: FieldResponse[];
  total?: number;
  page?: number;
  limit?: number;
}

class FieldService {
  /**
   * Get all fields
   */
  async getFields(): Promise<FieldResponse[]> {
    const response = await axiosInstance.get<FieldListResponse>('/admin/fields');
    const fields = response.data.data || (response.data as any);
    if (Array.isArray(fields)) {
      return fields.map((field: any) => ({
        ...field,
        imageUrls: field.imageUrls || field.images?.map((img: any) => img.imageUrl) || [],
      }));
    }
    return [];
  }

  /**
   * Get field by ID
   */
  async getFieldById(id: string): Promise<FieldResponse> {
    const response = await axiosInstance.get<{ data: FieldResponse }>(`/admin/fields/${id}`);
    const field = response.data.data || (response.data as any);
    return {
      ...field,
      imageUrls: field.imageUrls || field.images?.map((img: any) => img.imageUrl) || [],
    };
  }

  /**
   * Create new field
   */
  async createField(payload: CreateFieldPayload): Promise<FieldResponse> {
    const response = await axiosInstance.post<{ data: FieldResponse }>('/admin/fields', payload);
    const field = response.data.data || (response.data as any);
    return {
      ...field,
      imageUrls: field.imageUrls || field.images?.map((img: any) => img.imageUrl) || [],
    };
  }

  /**
   * Update field
   */
  async updateField(id: string, payload: Partial<CreateFieldPayload>): Promise<FieldResponse> {
    const response = await axiosInstance.patch<{ data: FieldResponse }>(`/admin/fields/${id}`, payload);
    const field = response.data.data || (response.data as any);
    return {
      ...field,
      imageUrls: field.imageUrls || field.images?.map((img: any) => img.imageUrl) || [],
    };
  }

  /**
   * Delete field
   */
  async deleteField(id: string): Promise<void> {
    await axiosInstance.delete(`/admin/fields/${id}`);
  }

  /**
   * Upload field image file
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<{ data: { imageUrl: string } }>(
      '/admin/fields/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.imageUrl;
  }
}

export const fieldService = new FieldService();
