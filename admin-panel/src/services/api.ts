import axios, { AxiosInstance, AxiosResponse } from 'axios';

const TOKEN_KEY = 'srs_token';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

export interface Admin {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
}

export interface Family {
  id: number;
  familyId: string;
  headName: string;
  mobileNumber: string;
  address: string;
  isActive: boolean;
  memberCount?: number;
  username?: string;
  createdAt: string;
  updatedAt: string;
  riceEntitlement?: RiceEntitlement;
}

export interface CreateFamilyRequest {
  familyId: string;
  headName: string;
  mobileNumber: string;
  address: string;
  username: string;
  password: string;
  memberCount: number;
}

export interface UpdateFamilyRequest {
  headName?: string;
  mobileNumber?: string;
  address?: string;
  isActive?: boolean;
}

export interface Member {
  id: number;
  familyId: number;
  name: string;
  age: number;
  gender: string;
  relation: string;
  isFamilyHead: boolean;
  accountStatus: string;
  faceEnrollmentStatus: string;
  createdAt: string;
}

export interface CreateMemberRequest {
  name: string;
  age?: number;
  gender?: string;
  relation: string;
  isFamilyHead?: boolean;
  accountStatus?: string;
}

export interface CreateMemberUserRequest {
  username: string;
  password: string;
}

export interface RiceEntitlement {
  id: number;
  familyId: number;
  monthlyQuotaKg: number;
  unitPerMemberKg: number;
  effectiveFrom: string;
}

export interface SetEntitlementRequest {
  monthlyQuotaKg: number;
  unitPerMemberKg: number;
}

export interface RiceDistribution {
  id: number;
  familyId: string;
  familyHeadName: string;
  mobileNumber: string;
  distributedKg: number;
  remainingKg: number;
  distributedBy: number;
  distributionDate: string;
  monthYear: string;
  status: string;
  notes?: string;
}

export interface DistributeRiceRequest {
  familyId: string;
  distributedKg: number;
  notes?: string;
}

export interface Notification {
  id: number;
  familyId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalFamilies: number;
  totalActiveFamilies: number;
  totalMembers: number;
  totalRiceDistributedTodayKg: number;
  totalRiceDistributedMonthKg: number;
  recentTransactions: RiceDistribution[];
  recentFamilies: any[];
  pendingCollections: any[];
}

export interface Transaction {
  id: number;
  familyId: string;
  familyHeadName: string;
  mobileNumber: string;
  distributedKg: number;
  remainingKg: number;
  distributionDate: string;
  status: string;
}

export interface MonthlyFamilyData {
  month: string;
  families: number;
}

export interface ReportResponse {
  stats: DashboardStats;
  monthlyFamilies: MonthlyFamilyData[];
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('srs_user');
      localStorage.removeItem('srs_admin');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error: any, fallback = 'Something went wrong'): string => {
  if (error?.response?.data?.message) {
    return typeof error.response.data.message === 'string'
      ? error.response.data.message
      : error.response.data.message[0] || fallback;
  }
  if (error?.message) return error.message;
  return fallback;
};

export const LoginService = {
  async login(payload: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/admin/login', payload);
    return data;
  },
};

export const FamilyService = {
  async list(params?: { search?: string; familyId?: string; mobileNumber?: string }): Promise<Family[]> {
    const { data } = await api.get<Family[]>('/admin/families', { params });
    return data;
  },
  async get(id: number): Promise<Family> {
    const { data } = await api.get<Family>(`/admin/families/${id}`);
    return data;
  },
  async create(payload: CreateFamilyRequest): Promise<Family> {
    const { data } = await api.post<Family>('/admin/families', payload);
    return data;
  },
  async update(id: number, payload: UpdateFamilyRequest): Promise<Family> {
    const { data } = await api.put<Family>(`/admin/families/${id}`, payload);
    return data;
  },
  async disable(id: number): Promise<Family> {
    const { data } = await api.patch<Family>(`/admin/families/${id}/disable`);
    return data;
  },
  async enable(id: number): Promise<Family> {
    const { data } = await api.patch<Family>(`/admin/families/${id}/enable`);
    return data;
  },
  async resetPassword(id: number, payload: { newPassword: string }): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/admin/families/${id}/reset-password`, payload);
    return data;
  },
};

export const MemberService = {
  async list(familyId: number): Promise<Member[]> {
    const { data } = await api.get<Member[]>(`/admin/families/${familyId}/members`);
    return data;
  },
  async create(familyId: number, payload: CreateMemberRequest): Promise<Member> {
    const { data } = await api.post<Member>(`/admin/families/${familyId}/members`, payload);
    return data;
  },
  async update(id: number, payload: Partial<CreateMemberRequest>): Promise<Member> {
    const { data } = await api.put<Member>(`/admin/members/${id}`, payload);
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/members/${id}`);
  },
  async createUser(id: number, payload: CreateMemberUserRequest): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/admin/members/${id}/create-user`, payload);
    return data;
  },
  async enrollFace(id: number, faceData: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/admin/members/${id}/enroll-face`, { faceData });
    return data;
  },
};

export const RiceService = {
  async getEntitlement(familyId: number): Promise<RiceEntitlement> {
    const { data } = await api.get<RiceEntitlement>(`/admin/rice/entitlement/${familyId}`);
    return data;
  },
  async setEntitlement(familyId: number, payload: SetEntitlementRequest): Promise<RiceEntitlement> {
    const { data } = await api.post<RiceEntitlement>(`/admin/rice/entitlement`, { familyId, ...payload });
    return data;
  },
  async distribute(payload: DistributeRiceRequest): Promise<RiceDistribution> {
    const { data } = await api.post<RiceDistribution>('/admin/rice/distribute', payload);
    return data;
  },
  async history(familyId?: number): Promise<RiceDistribution[]> {
    const { data } = await api.get<RiceDistribution[]>('/admin/rice/distributions', { params: { familyId } });
    return data;
  },
};

export const NotificationService = {
  async list(params?: { familyId?: number; isRead?: boolean }): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications', { params });
    return data;
  },
  async markRead(id: number): Promise<Notification> {
    const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
    return data;
  },
  async markAllRead(): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>('/notifications/read-all');
    return data;
  },
  async sendMonthlyReminders(): Promise<{ message: string; data: { count: number } }> {
    const { data } = await api.post<{ message: string; data: { count: number } }>('/admin/notifications/send-reminders');
    return data;
  },
};

export const ReportService = {
  async dashboard(): Promise<ReportResponse> {
    const { data } = await api.get<ReportResponse>('/admin/reports/dashboard');
    return data;
  },
  async recentTransactions(limit = 10): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/admin/reports/transactions', { params: { limit } });
    return data;
  },
  async recentFamilies(limit = 10): Promise<Family[]> {
    const { data } = await api.get<Family[]>('/admin/reports/families', { params: { limit } });
    return data;
  },
};

export default api;
