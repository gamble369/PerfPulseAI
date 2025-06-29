/**
 * API service for communicating with the backend
 */

// Generic fetch function with error handling
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const url = `/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for cross-origin requests
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.detail || errorData.message;
      if (!errorMessage) {
        errorMessage = `后端错误: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    fetchApi<{ data: { userId: string; name: string; email: string }; message: string; success: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) => 
    fetchApi<{ data: { userId: string; name: string; email: string }; message: string; success: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  resetPassword: (email: string, password: string) =>
    fetchApi<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  checkHealth: () => 
    fetchApi<{ status: string; code: number; message: string }>('/health', {
      // Skip authentication for health check
      headers: {}
    }),
};

// User API
export const userApi = {
  getProfile: () => {
    const userId = localStorage.getItem('token');
    return fetchApi<any>(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${userId}`,
      },
    });
  },
  updateProfile: (data: any) => {
    const userId = localStorage.getItem('token');
    return fetchApi<any>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${userId}`,
      },
    });
  },
};

// Activity API
export const activityApi = {
  getActivities: () => 
    fetchApi<any[]>('/activity/list', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  getActivityById: (id: number) => 
    fetchApi<any>(`/activity/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};

// Reward API
export const rewardApi = {
  getRewards: () => 
    fetchApi<any[]>('/reward/list', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  claimReward: (id: number) => 
    fetchApi<any>(`/reward/claim/${id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};

// Scoring API
export const scoringApi = {
  getScores: () => 
    fetchApi<any>('/scoring/summary', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  getScoreHistory: () => 
    fetchApi<any[]>('/scoring/history', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};
