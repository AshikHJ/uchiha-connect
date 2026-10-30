import { Participant, AppConfig, PublicationStatus } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

function getStoredToken(): string | null {
  return localStorage.getItem('uc_token') || localStorage.getItem('cid_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('uc_token', token);
  } else {
    localStorage.removeItem('uc_token');
    localStorage.removeItem('cid_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = '';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || '';
    } catch {
      const text = await response.text().catch(() => '');
      if (response.status === 405) {
        errorMsg = 'API method not allowed (405). Serverless routing is refreshing.';
      } else if (response.status === 404) {
        errorMsg = 'API endpoint not found (404).';
      } else if (text && text.length < 120 && !text.includes('<!DOCTYPE')) {
        errorMsg = text;
      }
    }
    throw new Error(errorMsg || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    async login(pin: string): Promise<{ success: boolean; token: string }> {
      const res = await request<{ success: boolean; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (res.token) {
        setStoredToken(res.token);
      }
      return res;
    },

    async getStatus(): Promise<{ isAuthenticated: boolean }> {
      return request<{ isAuthenticated: boolean }>('/auth/status');
    },

    async logout(): Promise<void> {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setStoredToken(null);
      }
    },

    async changePin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
      return request('/auth/change-pin', {
        method: 'POST',
        body: JSON.stringify({ currentPin, newPin }),
      });
    },
  },

  participants: {
    async getAll(): Promise<{ participants: Participant[]; config: AppConfig }> {
      return request<{ participants: Participant[]; config: AppConfig }>('/participants');
    },

    async getById(id: string): Promise<Participant> {
      return request<Participant>(`/participants/${id}`);
    },

    async create(data: Partial<Participant>): Promise<Participant> {
      return request<Participant>('/participants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: Partial<Participant>): Promise<Participant> {
      return request<Participant>(`/participants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async publish(id: string): Promise<{ success: boolean; participant: Participant }> {
      return request<{ success: boolean; participant: Participant }>(`/participants/${id}/publish`, {
        method: 'POST',
      });
    },

    async unpublish(id: string): Promise<{ success: boolean; participant: Participant }> {
      return request<{ success: boolean; participant: Participant }>(`/participants/${id}/unpublish`, {
        method: 'POST',
      });
    },

    async resetSlot(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/participants/${id}`, {
        method: 'DELETE',
      });
    },

    async bulkImport(participants: Partial<Participant>[]): Promise<{ success: boolean; importedCount: number }> {
      return request<{ success: boolean; importedCount: number }>('/participants/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ participants }),
      });
    },
  },

  publicProfile: {
    async getByUsername(username: string): Promise<{ participant: Participant; hackathonName: string }> {
      return request<{ participant: Participant; hackathonName: string }>(`/public/profile/${username}`);
    },
  },

  settings: {
    async get(): Promise<AppConfig> {
      return request<AppConfig>('/settings');
    },

    async update(data: Partial<AppConfig>): Promise<{ success: boolean; config: AppConfig }> {
      return request<{ success: boolean; config: AppConfig }>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  upload: {
    async uploadImage(imageBase64: string, filename?: string): Promise<{ url: string; success: boolean }> {
      return request<{ url: string; success: boolean }>('/upload', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, filename }),
      });
    },
  },
};
