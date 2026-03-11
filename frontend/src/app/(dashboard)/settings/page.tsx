'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  User, Lock, Palette, AlertTriangle, Check, Loader2, Sun, Moon, Monitor, LogOut,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Tab config ───────────────────────────

const TABS = [
  { id: 'profile',    label: 'Profile',    icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security',   label: 'Security',   icon: Lock },
  { id: 'danger',     label: 'Danger Zone',icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Reusable field ───────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-1 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );
}

// ─── Profile tab ─────────────────────────

function ProfileTab() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail]       = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await usersApi.updateProfile({ username, email, avatarUrl: avatarUrl || undefined });
      updateUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-md">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            (user?.username?.[0] ?? 'U').toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Field label="Username"  value={username}  onChange={setUsername} placeholder="your_username" />
      <Field label="Email"     value={email}     onChange={setEmail}    placeholder="you@example.com" type="email" />
      <Field label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://…/avatar.png" />

      {error   && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"><Check className="h-4 w-4" /> Profile updated</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Appearance tab ───────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light',  label: 'Light',  icon: Sun },
    { value: 'dark',   label: 'Dark',   icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-md space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                theme === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent',
              )}
            >
              <Icon className={cn('h-6 w-6', theme === value ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-xs font-medium', theme === value ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
              {theme === value && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">System</strong> follows your OS preference automatically.
          Changes apply instantly across the entire app.
        </p>
      </div>
    </div>
  );
}

// ─── Security tab ─────────────────────────

function SecurityTab() {
  const [current, setCurrent]   = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (newPass !== confirm) { setError('New passwords do not match'); return; }
    if (newPass.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await usersApi.changePassword(current, newPass);
      setSuccess(true);
      setCurrent(''); setNewPass(''); setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <Field label="Current Password" value={current}   onChange={setCurrent}  type="password" placeholder="••••••••" />
      <Field label="New Password"     value={newPass}   onChange={setNewPass}  type="password" placeholder="••••••••" />
      <Field label="Confirm Password" value={confirm}   onChange={setConfirm}  type="password" placeholder="••••••••" />

      {error   && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"><Check className="h-4 w-4" /> Password changed</p>}

      <button
        type="submit"
        disabled={saving || !current || !newPass || !confirm}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Updating…' : 'Change Password'}
      </button>
    </form>
  );
}

// ─── Danger zone tab ─────────────────────

function DangerTab() {
  const { logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function handleDelete() {
    if (confirmText !== 'delete my account') return;
    setDeleting(true);
    try {
      await usersApi.deleteAccount();
      logout();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      {/* Logout */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Sign Out</p>
        <p className="mt-1 text-xs text-muted-foreground">Sign out from your current session.</p>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Delete account */}
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Permanently delete your account and all data. This cannot be undone.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Type <strong className="text-foreground">delete my account</strong> to confirm:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full rounded-lg border border-red-300 bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 dark:border-red-800"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirming(false); setConfirmText(''); }}
                className="flex-1 rounded-lg border border-border py-2 text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'delete my account' || deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Settings" />

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar nav */}
        <nav className="flex shrink-0 gap-1 border-b border-border p-3 md:w-52 md:flex-col md:border-b-0 md:border-r md:p-4 overflow-x-auto md:overflow-x-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left',
                tab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                id === 'danger' && tab !== 'danger' && 'hover:text-red-500',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold">
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
          </div>

          {tab === 'profile'    && <ProfileTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'security'   && <SecurityTab />}
          {tab === 'danger'     && <DangerTab />}
        </div>
      </div>
    </div>
  );
}
