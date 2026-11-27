import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button } from "@/components/ui";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { getRoleCode } from "@/app/navigation";
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  FormModal,
  FormSection,
  FormActions,
  FormInput,
  FormTextarea,
} from "../../realty/_shared/FormModal";

interface RoleItem {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  permissions?: string[];
}

interface PermissionItem {
  id: number;
  code: string;
  module: string;
  action: string;
  description?: string;
}

export default function RolesMasterPage() {
  const { user } = useAuthContext();
  const currentRole = getRoleCode(user?.role);
  const isAuthorized =
    currentRole === "super_admin" || currentRole === "admin" || currentRole === "boss";

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    if (isAuthorized) {
      fetchRolesAndPermissions();
    }
  }, [isAuthorized]);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        axios.get("/roles"),
        axios.get("/roles/permissions"),
      ]);

      const rList = rolesRes.data?.data || rolesRes.data || [];
      const pData = permsRes.data?.data || permsRes.data || {};

      setRoles(Array.isArray(rList) ? rList : []);
      setGroupedPermissions(pData.grouped || {});
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      permissions: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = async (role: RoleItem) => {
    setEditingRole(role);
    try {
      const res = await axios.get(`/roles/${role.id}`);
      const details = res.data?.data || res.data;
      setFormData({
        name: details.name,
        code: details.code,
        description: details.description || "",
        permissions: details.permissions || [],
      });
      setModalOpen(true);
    } catch (err: any) {
      alert(`Could not load role details: ${err.message}`);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (role.isSystem) {
      alert("System roles are protected and cannot be deleted.");
      return;
    }
    if (role.userCount > 0) {
      alert(`Cannot delete role: ${role.userCount} active users are currently assigned to this role.`);
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete role '${role.name}'?`)) {
      return;
    }

    try {
      await axios.delete(`/roles/${role.id}`);
      await fetchRolesAndPermissions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete role");
    }
  };

  const handleTogglePermission = (permCode: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permCode);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permCode)
          : [...prev.permissions, permCode],
      };
    });
  };

  const handleToggleModuleAll = (modulePerms: PermissionItem[]) => {
    const moduleCodes = modulePerms.map((p) => p.code);
    const allSelected = moduleCodes.every((c) => formData.permissions.includes(c));

    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !moduleCodes.includes(p))
        : Array.from(new Set([...prev.permissions, ...moduleCodes])),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Role Name is required");
      return;
    }
    if (!editingRole && !formData.code.trim()) {
      alert("Role Code is required");
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        await axios.patch(`/roles/${editingRole.id}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          permissions: formData.permissions,
        });
      } else {
        await axios.post("/roles", {
          name: formData.name.trim(),
          code: formData.code.trim().toLowerCase(),
          description: formData.description.trim() || undefined,
          permissions: formData.permissions,
        });
      }

      setModalOpen(false);
      await fetchRolesAndPermissions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <Page title="Access Restricted">
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="size-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
            <LockClosedIcon className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-dark-100">
            Access Restricted (Admin Only)
          </h2>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-2">
            The Role &amp; Permission Management Master is accessible strictly to Platform Super Administrators and Tenant Administrators.
          </p>
        </div>
      </Page>
    );
  }

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="Roles & Permissions Master">
      <div className="w-full space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <ShieldCheckIcon className="size-7 text-primary-600" />
              Role &amp; Permission Master
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-400 mt-1">
              Configure system roles, create custom departmental profiles, and assign granular security permissions across Realty, Trushift Attendance, and ERP modules.
            </p>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 text-xs py-2"
          >
            <PlusIcon className="size-4" /> Create Custom Role
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="w-full sm:w-80 relative">
            <MagnifyingGlassIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </Card>

        {/* Roles Table */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-750 text-slate-500 dark:text-dark-300 font-bold uppercase tracking-wider border-b dark:border-dark-700">
                <tr>
                  <th className="py-3 px-4">Role Name &amp; Code</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Active Users</th>
                  <th className="py-3 px-4">Granted Permissions</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading role profiles...
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No roles matching search found.
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-dark-750/50 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-dark-100">
                          {role.name}
                        </div>
                        <span className="font-mono text-[11px] text-primary-600 dark:text-primary-400">
                          {role.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {role.isSystem ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            <LockClosedIcon className="size-3" /> SYSTEM PROTECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                            CUSTOM ROLE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold font-mono text-slate-800 dark:text-dark-200">
                          {role.userCount} Users
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                          {role.permissionCount} Permissions
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-dark-400 max-w-xs truncate">
                        {role.description || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button
                          variant="outlined"
                          color="neutral"
                          onClick={() => handleOpenEdit(role)}
                          className="text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <PencilSquareIcon className="size-3.5" /> Permissions &amp; Edit
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={role.userCount > 0}
                            onClick={() => handleDelete(role)}
                            className="text-[11px] py-1 px-2 inline-flex items-center gap-1"
                            title={
                              role.userCount > 0
                                ? "Cannot delete role assigned to active users"
                                : "Delete Role"
                            }
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Add / Edit Role */}
        {modalOpen && (
          <FormModal
            title={editingRole ? `Configure Role: ${editingRole.name}` : "Create New Custom Role"}
            subtitle="Define functional permissions across Realty Sales, Trushift Attendance & ERP"
            icon={<KeyIcon className="size-5" />}
            onClose={() => setModalOpen(false)}
            maxWidth="xl"
          >
            <form onSubmit={handleSave} className="space-y-6">
              <FormSection label="Role Identity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Role Display Name"
                    required
                    placeholder="e.g. Pre-Sales Team Lead"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <FormInput
                    label="Role Code (Unique)"
                    required
                    disabled={Boolean(editingRole && editingRole.isSystem)}
                    placeholder="e.g. presales_lead"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <FormTextarea
                  label="Role Responsibilities / Description"
                  rows={2}
                  placeholder="Outline who this role applies to and scope of responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormSection>

              <FormSection
                label={`Functional Permissions Matrix (${formData.permissions.length} Selected)`}
              >
                <p className="text-xs text-slate-500 dark:text-dark-400 -mt-2">
                  Select which operations this role can view, execute, or authorize.
                </p>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                    const moduleCodes = perms.map((p) => p.code);
                    const allSelected = moduleCodes.every((c) =>
                      formData.permissions.includes(c)
                    );

                    return (
                      <div
                        key={moduleName}
                        className="rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b pb-2 dark:border-dark-700">
                          <span className="font-bold text-xs uppercase tracking-wider text-primary-700 dark:text-primary-300">
                            {moduleName} ({perms.length} Permissions)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(perms)}
                            className="text-[11px] font-semibold text-primary-600 hover:text-primary-800 dark:text-primary-400"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isChecked = formData.permissions.includes(p.code);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? "bg-primary-50/60 dark:bg-primary-950/40 border-primary-300 dark:border-primary-800 text-primary-950 dark:text-primary-100"
                                    : "bg-white dark:bg-dark-750 border-slate-200 dark:border-dark-700 text-slate-700 dark:text-dark-300 hover:bg-slate-100/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.code)}
                                  className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold truncate">{p.action.toUpperCase()}</div>
                                  <div className="font-mono text-[10px] text-slate-400 truncate">
                                    {p.code}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormSection>

              <FormActions>
                <Button variant="outlined" color="neutral" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="filled" color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingRole ? "Save Role Permissions" : "Create Role"}
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
