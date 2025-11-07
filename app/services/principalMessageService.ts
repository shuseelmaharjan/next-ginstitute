import apiHandler from "../api/apiHandler";

export interface PrincipalMessage {
  id: number;
  message: string;
  profilePicture: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: number;
    fullName: string;
  };
  updatedByUser?: {
    id: number;
    fullName: string;
  };
}

export interface PrincipalMessageResponse {
  success: boolean;
  message: string;
  data: PrincipalMessage | null;
}

class PrincipalMessageService {
  async getPrincipalMessage(): Promise<PrincipalMessage | null> {
    const response = await apiHandler<PrincipalMessageResponse>({
      url: "/api/v1/principal-message",
      method: "GET",
    });

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch principal message");
  }

  async createPrincipalMessage(message: string, profilePicture: File): Promise<PrincipalMessage> {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("profilePicture", profilePicture);

    const response = await apiHandler<PrincipalMessageResponse>({
      url: "/api/v1/principal-message",
      method: "POST",
      data: formData,
    });

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to create principal message");
  }

  async updatePrincipalMessage(
    id: number,
    message?: string,
    profilePicture?: File
  ): Promise<PrincipalMessage> {
    const formData = new FormData();

    if (message !== undefined) {
      formData.append("message", message);
    }

    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }

    const response = await apiHandler<PrincipalMessageResponse>({
      url: `/api/v1/principal-message/${id}`,
      method: "PUT",
      data: formData,
    });

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to update principal message");
  }

  async deletePrincipalMessage(id: number): Promise<void> {
    const response = await apiHandler<PrincipalMessageResponse>({
      url: `/api/v1/principal-message/${id}`,
      method: "DELETE",
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to delete principal message");
    }
  }
}

export default new PrincipalMessageService();

