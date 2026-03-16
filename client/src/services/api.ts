import axios, { AxiosResponse } from 'axios';
import { ApiResponse, ChitGroup, Member, Payment, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: async (email: string, password: string): Promise<AxiosResponse<ApiResponse<{ token: string; admin: User }>>> => {
    return await api.post('/auth/login', { email, password });
  },
  
  register: async (name: string, email: string, password: string, role: string): Promise<AxiosResponse<ApiResponse<{ token: string; admin: User }>>> => {
    return await api.post('/auth/register', { name, email, password, role });
  },
  
  getProfile: async (): Promise<AxiosResponse<ApiResponse<{ admin: User }>>> => {
    return await api.get('/auth/me');
  },
  
  updateProfile: async (name: string, email: string): Promise<AxiosResponse<ApiResponse<{ admin: User }>>> => {
    return await api.put('/auth/profile', { name, email });
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  // WhatsApp
  getWhatsAppStatus: async (): Promise<AxiosResponse<ApiResponse<{ enabled: boolean; fromNumber: string | null; hasCredentials: boolean }>>> => {
    return await api.get('/auth/whatsapp/status');
  },
  saveWhatsAppCredentials: async (data: { whatsappPhoneNumberId: string; whatsappAccessToken: string; whatsappFromNumber: string }): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.put('/auth/whatsapp', data);
  },
  disconnectWhatsApp: async (): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.delete('/auth/whatsapp');
  },
  testWhatsApp: async (phone: string): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.post('/auth/whatsapp/test', { phone });
  },
};

// Chit API endpoints
export const chitAPI = {
  create: async (data: Omit<ChitGroup, '_id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<ApiResponse<{ chitGroup: ChitGroup }>>> => {
    return await api.post('/chits/create', data);
  },
  
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<AxiosResponse<ApiResponse<{ chitGroups: ChitGroup[] }>>> => {
    return await api.get('/chits', { params });
  },
  
  getById: async (id: string): Promise<AxiosResponse<ApiResponse<{ chitGroup: ChitGroup; members: Member[]; stats: any }>>> => {
    return await api.get(`/chits/${id}`);
  },
  
  update: async (id: string, data: Partial<ChitGroup>): Promise<AxiosResponse<ApiResponse<{ chitGroup: ChitGroup }>>> => {
    return await api.put(`/chits/${id}`, data);
  },
  
  delete: async (id: string): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.delete(`/chits/${id}`);
  },
  
  uploadPayoutSchedule: async (id: string, data: { payoutSchedule: Array<{ month: number; payoutAmount: number }> }): Promise<AxiosResponse<ApiResponse<{ chitGroup: ChitGroup }>>> => {
    return await api.post(`/chits/${id}/upload-payout-schedule`, data);
  },
  
  getDashboard: async (id: string): Promise<AxiosResponse<ApiResponse<{ chitGroup: ChitGroup; members: Member[]; paymentGrid: any[]; monthlyCollections: any[]; stats: any }>>> => {
    return await api.get(`/chits/${id}/dashboard`);
  },
};

// Member API endpoints
export const memberAPI = {
  create: async (data: { name: string; phone: string; chitGroupId: string }): Promise<AxiosResponse<ApiResponse<{ member: Member }>>> => {
    return await api.post('/members/add', data);
  },
  
  getAll: async (params?: { page?: number; limit?: number; chitGroupId?: string; search?: string }): Promise<AxiosResponse<ApiResponse<{ members: Member[]; pagination: any }>>> => {
    return await api.get('/members', { params });
  },
  
  getById: async (id: string): Promise<AxiosResponse<ApiResponse<{ member: Member; paymentHistory: Payment[]; paymentStatus: any[]; totals: any }>>> => {
    return await api.get(`/members/${id}`);
  },
  
  update: async (id: string, data: FormData): Promise<AxiosResponse<ApiResponse<{ member: Member }>>> => {
    return await api.put(`/members/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  delete: async (id: string): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.delete(`/members/${id}`);
  },
  
  getPaymentStatus: async (id: string): Promise<AxiosResponse<ApiResponse<{ member: any; paymentStatus: any[]; summary: any }>>> => {
    return await api.get(`/members/${id}/payment-status`);
  },
  
  markAsLeft: async (id: string): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.post(`/members/${id}/leave`);
  },

  recordWithdrawal: async (id: string, month?: number): Promise<AxiosResponse<ApiResponse<{ member: Member }>>> => {
    return await api.post(`/members/${id}/withdraw`, { month });
  },
};

// Payment API endpoints
export const paymentAPI = {
  create: async (data: Omit<Payment, '_id' | 'createdAt' | 'updatedAt' | 'receiptNumber' | 'isVerified'>): Promise<AxiosResponse<ApiResponse<{ payment: Payment; receipt: any; member: any }>>> => {
    return await api.post('/payments/record', data);
  },
  
  getAll: async (params?: { page?: number; limit?: number; chitGroupId?: string; memberId?: string; month?: number; startDate?: string; endDate?: string }): Promise<AxiosResponse<ApiResponse<{ payments: Payment[]; pagination: any }>>> => {
    return await api.get('/payments', { params });
  },
  
  getById: async (id: string): Promise<AxiosResponse<ApiResponse<{ payment: Payment }>>> => {
    return await api.get(`/payments/${id}`);
  },
  
  update: async (id: string, data: Partial<Payment>): Promise<AxiosResponse<ApiResponse<{ payment: Payment; member: any }>>> => {
    return await api.put(`/payments/${id}`, data);
  },
  
  delete: async (id: string): Promise<AxiosResponse<ApiResponse<{}>>> => {
    return await api.delete(`/payments/${id}`);
  },
  
  getMonthlyReport: async (chitGroupId: string, month: number): Promise<AxiosResponse<ApiResponse<{ report: any; chitGroup: any }>>> => {
    return await api.get(`/payments/monthly-report/${chitGroupId}/${month}`);
  },
  
  getMemberHistory: async (memberId: string): Promise<AxiosResponse<ApiResponse<{ member: any; paymentHistory: Payment[] }>>> => {
    return await api.get(`/payments/member-history/${memberId}`);
  },
  
  bulkCreate: async (data: { payments: Array<Omit<Payment, '_id' | 'createdAt' | 'updatedAt' | 'receiptNumber' | 'isVerified'>> }): Promise<AxiosResponse<ApiResponse<{ results: any[]; totalAmount: number; summary: any }>>> => {
    return await api.post('/payments/bulk-record', data);
  },
};

// Notification API endpoints
export const notificationAPI = {
  sendPaymentReceipt: async (data: { paymentId: string; memberId: string; chitGroupId: string }): Promise<AxiosResponse<ApiResponse<{ result: any; receipt: any }>>> => {
    return await api.post('/notifications/sendPaymentReceipt', data);
  },
  
  sendBulk: async (data: { chitGroupId: string; message: string; memberIds: string[]; mediaUrl?: string }): Promise<AxiosResponse<ApiResponse<{ results: any[]; summary: any }>>> => {
    return await api.post('/notifications/sendBulk', data);
  },
  
  sendGeneral: async (data: { memberId: string; message: string; mediaUrl?: string }): Promise<AxiosResponse<ApiResponse<{ result: any; member: any }>>> => {
    return await api.post('/notifications/sendGeneral', data);
  },
  
  sendPaymentReminder: async (data: { chitGroupId: string; month: number }): Promise<AxiosResponse<ApiResponse<{ results: any[]; summary: any }>>> => {
    return await api.post('/notifications/sendPaymentReminder', data);
  },
  
  getTemplates: async (): Promise<AxiosResponse<ApiResponse<{ templates: any }>>> => {
    return await api.get('/notifications/templates');
  },
  
  test: async (data: { phone: string; message: string }): Promise<AxiosResponse<ApiResponse<{ result: any }>>> => {
    return await api.post('/notifications/test', data);
  },
};

