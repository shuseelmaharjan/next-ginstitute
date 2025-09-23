import apiHandler from "../api/apiHandler";
import Cookies from "js-cookie";

export interface Department {
  id: number;
  facultyId: number;
  departmentName: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  faculty?: {
    id: number;
    facultyName: string;
    isActive: boolean;
  };
}

export interface CreateDepartmentRequest {
  facultyId: number;
  departmentName: string;
}

export interface UpdateDepartmentNameRequest {
  departmentName: string;
}

export interface UpdateDepartmentStatusRequest {
  isActive: boolean;
}

export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: Department | Department[];
}

class DepartmentService {
  private getAccessToken(): string | undefined {
    return Cookies.get("accessToken");
  }

  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error("Access token not found");

    const response = await apiHandler<DepartmentResponse>({
      url: "/api/v1/departments",
      method: "GET",
      accessToken,
    });

    if (response.success) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || "Failed to fetch departments");
  }

  // Get department by ID
  async getDepartmentById(id: number): Promise<Department> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error("Access token not found");

    const response = await apiHandler<DepartmentResponse>({
      url: `/api/v1/departments/${id}`,
      method: "GET",
      accessToken,
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch department");
  }

  // Create new department
  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error("Access token not found");

    const response = await apiHandler<DepartmentResponse>({
      url: "/api/v1/departments",
      method: "POST",
      accessToken,
      data,
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to create department");
  }

  // Update department name
  async updateDepartmentName(id: number, departmentName: string): Promise<Department> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error("Access token not found");

    const response = await apiHandler<DepartmentResponse>({
      url: `/api/v1/department/${id}/update`,
      method: "PUT",
      accessToken,
      data: { departmentName },
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to update department name");
  }

  // Update department status
  async updateDepartmentStatus(id: number, isActive: boolean): Promise<Department> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error("Access token not found");

    const response = await apiHandler<DepartmentResponse>({
      url: `/api/v1/${id}/status`,
      method: "PUT",
      accessToken,
      data: { isActive },
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to update department status");
  }

  // Get departments by faculty ID
  async getDepartmentsByFacultyId(facultyId: number): Promise<Department[]> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error("Access token not found");

    const response = await apiHandler<DepartmentResponse>({
      url: `/api/v1/departmentsfaculty/faculty/${facultyId}`,
      method: "GET",
      accessToken,
    });

    if (response.success) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || "Failed to fetch departments by faculty");
  }
}

export const departmentService = new DepartmentService();