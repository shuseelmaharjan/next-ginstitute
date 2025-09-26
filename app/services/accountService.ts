import apiHandler from '../api/apiHandler';

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

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

class AccountService {
    // Change password
    async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
        return apiHandler({
            url: '/api/auth/change-password',
            method: 'POST',
            data,
        });
    }

    // Get active sessions
    async getActiveSessions(): Promise<ApiResponse<SessionInfo[]>> {
        return apiHandler({
            url: '/api/sessions',
            method: 'GET',
        });
    }

    // Get current session info
    async getCurrentSession(): Promise<ApiResponse<SessionInfo>> {
        return apiHandler({
            url: '/api/sessions/current',
            method: 'GET',
        });
    }

    // Logout specific session
    async logoutSession(sessionId: string): Promise<ApiResponse> {
        return apiHandler({
            url: `/api/sessions/${sessionId}`,
            method: 'DELETE',
        });
    }

    // Logout all other sessions
    async logoutAllOtherSessions(): Promise<ApiResponse> {
        return apiHandler({
            url: '/api/sessions/logout-others',
            method: 'POST',
        });
    }

    // Logout all sessions
    async logoutAllSessions(): Promise<ApiResponse> {
        return apiHandler({
            url: '/api/sessions/logout-all',
            method: 'POST',
        });
    }
}

export const accountService = new AccountService();
export default AccountService;