"use client";
import apiHandler from "../api/apiHandler";

export interface FullUserResponse {
  success: boolean;
  data: any;
  message?: string;
}

export async function fetchFullUser(id: number) {
  return apiHandler<FullUserResponse>({ url: `/api/v1/users/${id}`, method: "GET" });
}

export async function updateUser(id: number, data: any) {
  return apiHandler<FullUserResponse>({ url: `/api/v1/users/${id}`, method: "PUT", data });
}
