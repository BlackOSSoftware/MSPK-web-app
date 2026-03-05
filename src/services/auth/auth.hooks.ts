import { useMutation } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clearAuthSession, resolveTokenAndExpiry, setAuthSession } from "@/lib/auth/session";
import { changePassword, getMe, login, logout, register, sendOtp, updateMe, verifyOtp } from "./auth.service";
import type {
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  SendOtpPayload,
  UpdateMePayload,
  VerifyOtpPayload,
} from "./auth.types";

const ME_QUERY_KEY = ["auth", "me"] as const;

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      const { token, expiresAt } = resolveTokenAndExpiry(data);
      setAuthSession(token, expiresAt);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (data) => {
      try {
        const { token, expiresAt } = resolveTokenAndExpiry(data);
        setAuthSession(token, expiresAt);
      } catch {
        // Registration responses don't always include a token.
      }
    },
  });
}

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => sendOtp(payload),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtp(payload),
    onSuccess: (data) => {
      try {
        const { token, expiresAt } = resolveTokenAndExpiry(data);
        setAuthSession(token, expiresAt);
      } catch {
        // OTP verification may only confirm email without returning a token.
      }
    },
  });
}

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    enabled,
  });
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => updateMe(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuthSession();
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  });
}
