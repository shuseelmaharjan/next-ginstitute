// Temporary shim to maintain backward compatibility after renaming to AuthenticateContext.
// Remove this file once all imports have been migrated to `AuthenticateContext`.
"use client";
export { AuthenticateProvider as AccessTokenProvider, useAuthenticate as useAccessToken } from './AuthenticateContext';