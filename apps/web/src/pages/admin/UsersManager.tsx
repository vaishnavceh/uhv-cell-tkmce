import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { UserProfile, RoleName } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, UserCheck, ShieldAlert, KeyRound, Search, CheckCircle } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const UsersManager: React.FC = () => {
  usePageTitle('Manage Staff Accounts');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleName: RoleName.EDITOR,
    isActive: true,
  });

  const { data: users, isLoading } = useQuery<UserProfile[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        const updatePayload: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleName: formData.roleName,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await apiClient.patch(`/admin/users/${editingUser.id}`, updatePayload);
      } else {
        await apiClient.post('/admin/users', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleName: RoleName.EDITOR,
      isActive: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.role?.name || RoleName.EDITOR,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const filtered = (users || []).filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Staff & Administrator Accounts</h1>
          </div>
          <p className="text-xs text-slate-500">
            Super Administrator console to provision faculty accounts, manage role tiers, and configure credentials.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="bg-institutional-850 hover:bg-institutional-950 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Provision Account
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search accounts by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <Table>
          <Thead>
            <Tr>
              <Th>Staff Member</Th>
              <Th className="w-36">Role Tier</Th>
              <Th className="w-36">Last Login</Th>
              <Th className="w-20 text-center">Status</Th>
              <Th className="w-24 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  Loading administrative users...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  No accounts found.
                </Td>
              </Tr>
            ) : (
              filtered.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-institutional-950">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                      {u.role?.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-500">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <Badge variant={u.isActive ? 'success' : 'danger'} className="text-[10px]">
                      {u.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </Td>
                  <Td className="text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(u.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      title="Deactivate / Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Staff Account' : 'Provision Staff Account'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Institutional Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!!editingUser}
            required
          />

          <Input
            label={editingUser ? 'Update Password (leave blank to keep current)' : 'Account Password *'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={editingUser ? '••••••••' : 'Min 8 characters'}
            required={!editingUser}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value as RoleName })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value={RoleName.SUPER_ADMIN}>SUPER_ADMIN (Full Authority)</option>
                <option value={RoleName.ADMIN}>ADMIN (Operations & Audit)</option>
                <option value={RoleName.EDITOR}>EDITOR (Curriculum & Media)</option>
                <option value={RoleName.CONTENT_MANAGER}>CONTENT_MANAGER (Documents & Events)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Account Enabled</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="bg-institutional-850 hover:bg-institutional-950 text-white"
            >
              {saveMutation.isPending ? 'Saving...' : editingUser ? 'Update Account' : 'Provision User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Remove Account"
        message="Are you sure you want to deactivate and remove this staff account?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};
