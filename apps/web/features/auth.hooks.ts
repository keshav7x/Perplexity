"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";
import { useAppDispatch } from "@/store/hooks";
import { logout as logoutAction, setUser } from "@/store/slices/authSlice";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe(enabled = true) {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: authKeys.me,
    enabled,
    retry: false,
    queryFn: async () => {
      try {
        const user = await api.get<User>("/auth/me");
        dispatch(setUser(user));
        return user;
      } catch {
        dispatch(setUser(null));
        return null;
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ user: User }>("/auth/login", input),
    onSuccess: (data) => {
      dispatch(setUser(data.user));
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: {
      name: string;
      age: number;
      email: string;
      password: string;
    }) => api.post<{ status: string }>("/auth/register", input),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: () => api.post<{ success: boolean }>("/auth/logout", {}),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      api.post<{ status: string }>("/auth/resend-verification", input),
  });
}
