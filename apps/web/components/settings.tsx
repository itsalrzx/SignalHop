'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Loader2, LockKeyhole, UserRound } from 'lucide-react';
import { api, updateProfile, type User } from '@/lib/api';
import { useAuth } from './providers';
import { Input } from './ui/input';
import { Button } from './ui/button';
export function Settings() {
  const { user, logout } = useAuth();
  const [success, setSuccess] = useState(false);
  const [validation, setValidation] = useState('');
  const profile = useMutation({
    mutationFn: (name: string) =>
      api<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify({ name }) }),
    onSuccess: (result) => {
      updateProfile(result.user);
      setSuccess(true);
    },
  });
  const password = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api('/users/me/password', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: async () => {
      await logout();
    },
  });
  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    profile.mutate(String(new FormData(e.currentTarget).get('name')).trim());
  }
  function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setValidation('');
    if (form.get('newPassword') !== form.get('confirmPassword')) {
      setValidation('The new passwords don’t match.');
      return;
    }
    password.mutate({
      currentPassword: String(form.get('currentPassword')),
      newPassword: String(form.get('newPassword')),
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">MAKE YOURSELF AT HOME</p>
          <h1>
            Settings<span className="text-[#31916a]">.</span>
          </h1>
          <p>A few details that make this space yours.</p>
        </div>
      </div>
      <div className="max-w-2xl space-y-6">
        <section className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#edf4eb] text-[#63846b]">
              <UserRound size={18} />
            </span>
            <div>
              <h2 className="font-semibold">Your profile</h2>
              <p className="mt-1 text-xs text-[#7c8a7d]">How you appear in SignalHop.</p>
            </div>
          </div>
          <form className="space-y-5" onSubmit={saveProfile}>
            <label className="field-label">
              Full name
              <Input
                name="name"
                defaultValue={user?.name}
                required
                maxLength={80}
                autoComplete="name"
              />
            </label>
            <label className="field-label">
              Email address
              <Input
                type="email"
                value={user?.email || ''}
                readOnly
                className="bg-[#f9fbf7] text-[#7f8c80]"
              />
              <span className="mt-2 block text-[10px] font-normal text-[#7f8c80]">
                Your sign-in email is read-only.
              </span>
            </label>
            {profile.error && (
              <p role="alert" className="error-banner">
                {profile.error.message}
              </p>
            )}
            <div className="flex items-center justify-between border-t border-[#edf1e9] pt-5">
              {success ? (
                <p role="status" className="flex items-center gap-1.5 text-xs text-[#2f845b]">
                  <Check size={14} />
                  Profile updated.
                </p>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={profile.isPending}>
                {profile.isPending && <Loader2 size={15} className="animate-spin" />}Save profile
              </Button>
            </div>
          </form>
        </section>
        <section className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f5f0e7] text-[#ad9063]">
              <LockKeyhole size={18} />
            </span>
            <div>
              <h2 className="font-semibold">Keep your account secure</h2>
              <p className="mt-1 text-xs text-[#7c8a7d]">Changing your password signs you out.</p>
            </div>
          </div>
          <form onSubmit={savePassword} className="space-y-5">
            <label className="field-label">
              Current password
              <Input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                minLength={10}
                maxLength={128}
                required
              />
            </label>
            <label className="field-label">
              New password
              <Input
                name="newPassword"
                aria-label="New password"
                aria-describedby="new-password-hint"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
              <span
                className="mt-2 block text-[10px] font-normal text-[#7f8c80]"
                id="new-password-hint"
              >
                Use at least 10 characters.
              </span>
            </label>
            <label className="field-label">
              Confirm new password
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
            </label>
            {(validation || password.error) && (
              <p role="alert" className="error-banner">
                {validation || password.error?.message}
              </p>
            )}
            <div className="flex justify-end border-t border-[#edf1e9] pt-5">
              <Button type="submit" variant="outline" disabled={password.isPending}>
                {password.isPending && <Loader2 size={15} className="animate-spin" />}Update
                password
              </Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
