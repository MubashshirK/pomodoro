import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api.get<{ user: User }>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

type AuthPayload = { email: string; password: string };

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuthPayload) =>
      api.post<{ user: User }>("/auth/login", payload),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data);
      qc.invalidateQueries();
    },
  });
}

export function useGuestLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ user: User }>("/auth/guest"),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data);
      qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuthPayload) =>
      api.post<{ user: User }>("/auth/register", payload),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data);
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ message: string }>("/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(authKeys.me, null);
      qc.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      api.put<{ message: string }>("/auth/password", payload),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) =>
      api.put<{ user: User }>("/auth/profile", payload),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data);
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { confirmation: string }) =>
      api.delete<{ message: string }>("/auth/me", { body: payload }),
    onSuccess: () => {
      qc.setQueryData(authKeys.me, null);
      qc.clear();
    },
  });
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
