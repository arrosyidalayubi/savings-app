// src/hooks/useProfile.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ApiResponse, UserProfile } from '../types';

export const useProfile = (isAuthenticated: boolean, getAuthHeader: () => Record<string, string>) => {
  const queryClient = useQueryClient();

  // Inisialisasi state profil langsung membaca dari userProfile jika sudah ada saat pertama kali dipasang
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => { 
      const res = await fetch('/api/profile', { headers: getAuthHeader() }); 
      const json = await res.json(); 
      return json.data; 
    },
    enabled: isAuthenticated
  });

  const [profileForm, setProfileForm] = useState({ 
    name: userProfile?.name || '', 
    avatar: userProfile?.avatar || null 
  });
  
  const [passwordForm, setPasswordForm] = useState({ 
    old_password: '', 
    new_password: '' 
  });

  const updateProfile: UseMutationResult<ApiResponse<unknown>, Error, { name: string; avatar: string | null }> = useMutation({
    mutationFn: async (data: { name: string, avatar: string | null }) => {
      const res = await fetch('/api/profile', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, 
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message);
      return json;
    },
    onSuccess: () => { 
      alert('Profil berhasil diperbarui!'); 
      queryClient.invalidateQueries({ queryKey: ['profile'] }); 
    }
  });

  const updatePassword: UseMutationResult<ApiResponse<unknown>, Error, { old_password: string; new_password: string }> = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const res = await fetch('/api/password', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, 
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message);
      return json;
    },
    onSuccess: () => { 
      alert('Password berhasil diubah!'); 
      setPasswordForm({ old_password: '', new_password: '' }); 
    }
  });

  return { 
    userProfile, 
    profileForm, 
    setProfileForm, 
    passwordForm, 
    setPasswordForm, 
    updateProfile, 
    updatePassword 
  };
};