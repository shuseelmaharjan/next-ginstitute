import { createContext } from "react";
import { useAccessToken } from "../context/AccessTokenContext";

// This function will be injected by the app (see below)
let accessTokenGetter: () => Promise<string | null> = async () => null;

export const registerAccessTokenGetter = (getter: () => Promise<string | null>) => {
  accessTokenGetter = getter;
};

export const getAccessTokenFromContext = async () => {
  return await accessTokenGetter();
};
