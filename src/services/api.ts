const BASE_URL = 'http://localhost:8080/api/v1';

export interface Employee {
  employeeId?: number;
  employeeCode: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  createdAt?: string;
}

export interface EmployeePage {
  content: Employee[];
  page: number;
  size: number;
  totalElements: number;
}

export interface WorkloadAllocation {
  projectCode: string;
  allocationPercent: number;
}

export interface WorkloadResponse {
  employeeId: number;
  employeeName: string;
  totalAllocation: number;
  available: number;
  allocations: WorkloadAllocation[];
}

export interface Project {
  projectId?: number;
  projectCode: string;
  projectName: string;
  customer?: string;
  startDate?: string;
  endDate?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
  createdAt?: string;
}

export interface ProjectPage {
  content: Project[];
  page: number;
  size: number;
  totalElements: number;
}

export interface Allocation {
  allocationId?: number;
  employeeId: number;
  employeeName?: string;
  projectId: number;
  projectCode?: string;
  allocationPercent: number;
  roleInProject?: string;
  startDate?: string;
  endDate?: string;
}

export interface AllocationPage {
  content: Allocation[];
  page: number;
  size: number;
  totalElements: number;
}

export interface UtilizationResponse {
  employeeId: number;
  employeeName: string;
  totalAllocation: number;
}

export interface AvailableResponse {
  employeeId: number;
  employeeName: string;
  available: number;
}

export interface OverloadedResponse {
  employeeId: number;
  employeeName: string;
  totalAllocation: number;
}

export interface RecommendedResource {
  employee: string;
  available: number;
}

export interface AiRecommendResponse {
  recommendedResources: RecommendedResource[];
}

export interface AiRiskResponse {
  risks: string[];
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || 'An error occurred while communicating with the server';
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  // Employees API
  getEmployees: (params: { department?: string; role?: string; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.append('department', params.department);
    if (params.role) query.append('role', params.role);
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    return request<EmployeePage>(`/employees?${query.toString()}`);
  },
  getEmployee: (id: number) => request<Employee>(`/employees/${id}`),
  createEmployee: (employee: Employee) => request<Employee>('/employees', {
    method: 'POST',
    body: JSON.stringify(employee),
  }),
  updateEmployee: (id: number, employee: Employee) => request<Employee>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employee),
  }),
  deleteEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
  getEmployeeWorkload: (id: number) => request<WorkloadResponse>(`/employees/${id}/workload`),

  // Projects API
  getProjects: (params: { status?: string; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    return request<ProjectPage>(`/projects?${query.toString()}`);
  },
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (project: Project) => request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  }),
  updateProject: (id: number, project: Project) => request<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Allocations API
  getAllocations: (params: { employeeId?: number; projectId?: number; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId !== undefined) query.append('employeeId', String(params.employeeId));
    if (params.projectId !== undefined) query.append('projectId', String(params.projectId));
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    return request<AllocationPage>(`/allocations?${query.toString()}`);
  },
  getAllocation: (id: number) => request<Allocation>(`/allocations/${id}`),
  createAllocation: (allocation: Allocation) => request<Allocation>('/allocations', {
    method: 'POST',
    body: JSON.stringify(allocation),
  }),
  updateAllocation: (id: number, allocation: Allocation) => request<Allocation>(`/allocations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(allocation),
  }),
  deleteAllocation: (id: number) => request<void>(`/allocations/${id}`, { method: 'DELETE' }),

  // Reports API
  getUtilizationReport: () => request<UtilizationResponse[]>('/reports/utilization'),
  getAvailableReport: (minAvailable?: number) => {
    const query = minAvailable !== undefined ? `?minAvailable=${minAvailable}` : '';
    return request<AvailableResponse[]>(`/reports/available${query}`);
  },
  getOverloadedReport: () => request<OverloadedResponse[]>('/reports/overloaded'),

  // AI API
  askRecommendation: (query: string) => request<AiRecommendResponse>('/ai/recommend', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),
  askRiskDetection: (query: string) => request<AiRiskResponse>('/ai/risk-detection', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),
};
