import apiHandler from './apiHandler';
import Cookies from 'js-cookie';

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
    private getAccessToken(): string | undefined {
        return Cookies.get('accessToken');
    }

    // Change password
    async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
        const accessToken = this.getAccessToken();
        if (!accessToken) throw new Error('Access token not found');

        return apiHandler({
            url: '/api/auth/change-password',
            method: 'POST',
            data,
            accessToken,
        });
    }

    // Get active sessions
    async getActiveSessions(): Promise<ApiResponse<SessionInfo[]>> {
        const accessToken = this.getAccessToken();
        if (!accessToken) throw new Error('Access token not found');

        return apiHandler({
            url: '/api/sessions',
            method: 'GET',
            accessToken,
        });
    }

    // Get current session info
    async getCurrentSession(): Promise<ApiResponse<SessionInfo>> {
        const accessToken = this.getAccessToken();
        if (!accessToken) throw new Error('Access token not found');

        return apiHandler({
            url: '/api/sessions/current',
            method: 'GET',
            accessToken,
        });
    }

    // Logout specific session
    async logoutSession(sessionId: string): Promise<ApiResponse> {
        const accessToken = this.getAccessToken();
        if (!accessToken) throw new Error('Access token not found');

        return apiHandler({
            url: `/api/sessions/${sessionId}`,
            method: 'DELETE',
            accessToken,
        });
    }

    // Logout all other sessions
    async logoutAllOtherSessions(): Promise<ApiResponse> {
        const accessToken = this.getAccessToken();
        if (!accessToken) throw new Error('Access token not found');

        return apiHandler({
            url: '/api/sessions/logout-others',
            method: 'POST',
            accessToken,
        });
    }

    // Logout all sessions
    async logoutAllSessions(): Promise<ApiResponse> {
        const accessToken = this.getAccessToken();
        if (!accessToken) throw new Error('Access token not found');

        return apiHandler({
            url: '/api/sessions/logout-all',
            method: 'POST',
            accessToken,
        });
    }
}

export const accountService = new AccountService();