import React, { useEffect, useState } from 'react';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { Building2, UserPlus, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, organization } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'RECRUITER' as const,
    department: 'Engineering',
  });
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await client.get('/organizations/members');
      setMembers(res.data.data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/organizations/members/invite', inviteForm);
      setInviteSuccess(res.data.data.inviteUrl);
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'RECRUITER', department: 'Engineering' });
      fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error inviting member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">Organization Settings</h1>
          <p className="text-xs text-[#5e6b7c]">
            Manage workspace profile, team members, roles and access permissions
          </p>
        </div>

        {user?.role === 'ORG_ADMIN' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {inviteSuccess && (
        <div className="rounded-2xl bg-[#edf7d2] p-4 border border-[#edf7d2] text-xs text-[#567715] flex items-center justify-between">
          <div>
            <strong>Invitation generated!</strong> Share this link with your team member:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-bold text-[#0e1017]">{inviteSuccess}</code>
          </div>
          <button
            onClick={() => setInviteSuccess(null)}
            className="text-[#567715] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Organization Details Card */}
      <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#edf2f7] pb-4">
          <div className="rounded-2xl bg-[#edf7d2] p-3 text-[#567715]">
            <Building2 className="h-5 w-5 text-[#84b81b]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#0e1017]">{organization?.name}</h2>
            <p className="text-xs text-[#5e6b7c]">
              Workspace Slug: <code className="rounded bg-slate-100 px-1 text-[#0e1017]">{organization?.slug}</code> • Currency: INR (₹)
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-[#8b98a9] uppercase text-[10px] font-bold">Industry</span>
            <p className="font-bold text-[#0e1017] mt-0.5">{organization?.industry || 'Technology'}</p>
          </div>
          <div>
            <span className="text-[#8b98a9] uppercase text-[10px] font-bold">Market</span>
            <p className="font-bold text-[#0e1017] mt-0.5">India (IST Timezone)</p>
          </div>
          <div>
            <span className="text-[#8b98a9] uppercase text-[10px] font-bold">Departments</span>
            <p className="font-bold text-[#0e1017] mt-0.5">{organization?.departments?.length || 5} Configured</p>
          </div>
          <div>
            <span className="text-[#8b98a9] uppercase text-[10px] font-bold">Retention Policy</span>
            <p className="font-bold text-[#0e1017] mt-0.5">12 Months (DPDP Compliant)</p>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
        <div className="border-b border-[#edf2f7] pb-4">
          <h2 className="text-sm font-black text-[#0e1017]">Team Members & Access Roles</h2>
          <p className="text-xs text-[#5e6b7c]">
            Role-based access control protecting sensitive salary and candidate records
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#edf2f7] bg-[#f8fafc] text-[#5e6b7c]">
                <th className="p-3 font-bold">User Name</th>
                <th className="p-3 font-bold">Email</th>
                <th className="p-3 font-bold">Role</th>
                <th className="p-3 font-bold">Department</th>
                <th className="p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {members.map((m) => (
                <tr key={m._id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="p-3 font-bold text-[#0e1017]">{m.name}</td>
                  <td className="p-3 text-[#5e6b7c]">{m.email}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 font-black text-[#567715] text-[10px]">
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-[#5e6b7c]">{m.department || 'General'}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <h3 className="text-sm font-bold text-[#0e1017]">Invite Colleague to Workspace</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-[#8b98a9] hover:text-[#0e1017]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                >
                  <option value="RECRUITER">Recruiter</option>
                  <option value="HIRING_MANAGER">Hiring Manager</option>
                  <option value="INTERVIEWER">Interviewer</option>
                  <option value="FINANCE_APPROVER">Finance Approver</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Department</label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18]"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
