import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOfficer, deleteOfficer, fetchOfficers, updateOfficer, updateProfile } from "../api";
import type { CreateOfficerInput, UpdateOfficerInput, UpdateProfileInput } from "../types";
import { useSessionStore } from "../store/sessionStore";

export const userKeys = {
  all: ["users"] as const,
};

export function useOfficers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: fetchOfficers,
  });
}

export function useUpdateProfile() {
  const setSession = useSessionStore((state) => state.setSession);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (user) => setSession(user),
  });
}

export function useCreateOfficer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfficerInput) => createOfficer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateOfficer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateOfficerInput }) =>
      updateOfficer(userId, input),
    onSuccess: (officer, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      const session = useSessionStore.getState();
      if (session.user?.id === userId) {
        session.setSession({
          id: officer.id,
          name: officer.name,
          email: officer.email,
          role: officer.role,
          phone: officer.phone,
          department: officer.department,
        });
      }
    },
  });
}

export function useDeleteOfficer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteOfficer(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
