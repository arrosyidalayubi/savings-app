import { Icons } from '../components/ui/Icons';
import { type ChangeEvent } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';

interface SettingsViewProps {
  profileForm: { name: string; avatar: string | null };
  setProfileForm: (data: { name: string; avatar: string | null }) => void;
  userProfile: { email: string } | undefined;
  passwordForm: { old_password: string; new_password: string };
  setPasswordForm: (data: { old_password: string; new_password: string }) => void;
  updateProfile: UseMutationResult<unknown, Error, { name: string; avatar: string | null }>;
  updatePassword: UseMutationResult<unknown, Error, { old_password: string; new_password: string }>;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function SettingsView(props: SettingsViewProps) {
  const { profileForm, setProfileForm, userProfile, passwordForm, setPasswordForm, updateProfile, updatePassword, handleImageUpload, fileInputRef } = props;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profil */}
      <div className="bg-surface border border-border rounded-[20px] p-6 lg:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-primary mb-6">Pengaturan Profil</h3>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-sm">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-accent text-white flex items-center justify-center text-3xl font-bold">
                    {profileForm.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white"><Icons.Camera /></span>
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Nama Lengkap</label>
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
              <input type="email" value={userProfile?.email || ''} disabled className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-muted cursor-not-allowed opacity-70" />
            </div>
            <button onClick={() => updateProfile.mutate(profileForm)} disabled={updateProfile.isPending} className="px-6 py-2.5 bg-accent text-white font-bold rounded-lg shadow-md hover:opacity-90 transition">
              {updateProfile.isPending ? 'Menyimpan...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="bg-surface border border-border rounded-[20px] p-6 lg:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-primary mb-6">Ganti Password</h3>
        <form onSubmit={(e) => { e.preventDefault(); updatePassword.mutate(passwordForm); }} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Password Lama</label>
            <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Password Baru</label>
            <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent" required />
          </div>
          <button type="submit" disabled={updatePassword.isPending} className="px-6 py-2.5 bg-brand text-white font-bold rounded-lg shadow-md hover:opacity-90 transition">
            {updatePassword.isPending ? 'Memproses...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}