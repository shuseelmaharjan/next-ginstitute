import apiHandler from "../api/apiHandler";
import Cookies from "js-cookie";

export interface Faculty {
  id: number;
  facultyName: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacultyResponse {
  success: boolean;
  message: string;
  data: Faculty | Faculty[];
}

class FacultyService {
  private getAccessToken(): string | undefined {
    return Cookies.get("accessToken");
  }

  async getAllFaculties(): Promise<Faculty[]> {
    const response = await apiHandler<FacultyResponse>({
      url: "/api/v1/faculty",
      method: "GET",
    });

    if (response.success) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || "Failed to fetch faculties");
  }

  async getFacultyById(id: number): Promise<Faculty> {
    const response = await apiHandler<FacultyResponse>({
      url: `/api/v1/faculty/${id}`,
      method: "GET",
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch faculty");
  }

  async createFaculty(facultyName: string): Promise<Faculty> {
    const response = await apiHandler<FacultyResponse>({
      url: "/api/v1/faculty",
      method: "POST",
      data: { facultyName },
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to create faculty");
  }

  async updateFacultyName(id: number, facultyName: string): Promise<Faculty> {
    const response = await apiHandler<FacultyResponse>({
      url: `/api/v1/faculty/${id}/name`,
      method: "PUT",
      data: { facultyName },
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to update faculty name");
  }

  async updateFacultyStatus(id: number, isActive: boolean): Promise<Faculty> {
    const response = await apiHandler<FacultyResponse>({
      url: `/api/v1/faculty/${id}/status`,
      method: "PUT",
      data: { isActive },
    });

    if (response.success && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Failed to update faculty status");
  }
}

export const facultyService = new FacultyService();