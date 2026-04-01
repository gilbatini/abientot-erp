"use client";

import { useState, useTransition } from "react";
import { createUser, updateUserRole, deleteUser } from "@/actions/users";
import type { AppUser } from "@/actions/users";
import type { Role } from "@/types/app";

const ROLES: Role[] = ["admin", "agent", "viewer"];

const ROLE_BADGE: Record<Role, string> = {
  admin:  "bg-teal-50 text-teal-700",
  agent:  "bg-blue-50 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

export function UserManagement({ users: initialUsers, currentUserId }: { users: AppUser[]; currentUserId: string }) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("agent");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() { window.location.reload(); }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await createUser(email, password, newRole);
        setSuccess(`User ${email} created.`);
        setEmail("");
        setPassword("");
        setShowCreate(false);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create user.");
      }
    });
  }

  function handleRoleChange(userId: string, role: Role) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        setSuccess("Role updated.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update role.");
      }
    });
  }

  function handleDelete(userId: string, userEmail: string) {
    if (!confirm(`Delete user ${userEmail}? This cannot be undone.`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSuccess("User deleted.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete user.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2">{success}</p>}

      {/* User list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-gray-900 text-sm">Users ({users.length})</h2>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New User
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="user@example.com"
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Min. 8 chars"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={newRole} onChange={e => setNewRole(e.target.value as Role)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit" disabled={isPending}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {isPending ? "Creating…" : "Create"}
              </button>
              <button
                type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-medium">Email</th>
              <th className="text-left px-6 py-3 font-medium">Role</th>
              <th className="text-left px-6 py-3 font-medium">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-medium text-gray-900">{u.email}</td>
                <td className="px-6 py-3">
                  {u.id === currentUserId ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                      disabled={isPending}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-6 py-3 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-6 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
