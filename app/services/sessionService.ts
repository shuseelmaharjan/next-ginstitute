import apiHandler from "../api/apiHandler";

// Reuse types from accountService if desired; redefine minimal here to avoid circular import
export interface SessionInfo {
  sessionId: string;
  deviceInfo: string;
  browserInfo: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  ipAddress: string;
  lastActivity: string;
  loginTime: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export class SessionService {
  // No longer need getAccessToken; apiHandler handles token retrieval/refresh
  constructor() {}

  async getActiveSessions(): Promise<ApiResponse<SessionInfo[]>> {
    return apiHandler({
      url: "/api/sessions",
      method: "GET",
    });
  }

  async getCurrentSession(): Promise<ApiResponse<SessionInfo>> {
    return apiHandler({
      url: "/api/sessions/current",
      method: "GET",
    });
  }

  async logoutSession(sessionId: string): Promise<ApiResponse> {
    return apiHandler({
      url: `/api/sessions/${sessionId}`,
      method: "DELETE",
    });
  }

  async logoutAllOtherSessions(): Promise<ApiResponse> {
    return apiHandler({
      url: "/api/sessions/logout-others",
      method: "POST",
    });
  }

  async logoutAllSessions(): Promise<ApiResponse> {
    return apiHandler({
      url: "/api/sessions/logout-all",
      method: "POST",
    });
  }
}

export default SessionService;