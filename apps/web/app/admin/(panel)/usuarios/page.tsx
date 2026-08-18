"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, inputClass, Table } from "../../../../components/admin/ui";
import { IconPause, IconPencil, IconPlay, IconShieldCheck, IconTrash } from "../../../../components/icons";
import { useAdminGet, useAdminRequest } from "../../../../lib/admin/use-admin-api";
import { Paginated } from "../../../../lib/api/types";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isSuperadmin: boolean;
  lastLoginAt: string | null;
  role: { id: string; name: string } | null;
}

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { key: string; description: string | null } }[];
  _count: { users: number };
}

interface PermissionRow {
  id: string;
  key: string;
  module: string;
  description: string | null;
}

const EMPTY_USER = { email: "", password: "", firstName: "", lastName: "", roleId: "" };

export default function UsersAdminPage(): React.ReactNode {
  const [tab, setTab] = useState<"usuarios" | "roles">("usuarios");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Usuarios y roles</h1>
      <div className="flex gap-2 border-b border-stone-200">
        {(["usuarios", "roles"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium capitalize ${tab === key ? "border-b-2 border-brand-600 text-brand-700" : "text-stone-500"}`}
          >
            {key}
          </button>
        ))}
      </div>
      {tab === "usuarios" ? <UsersTab /> : <RolesTab />}
    </div>
  );
}

function UsersTab(): React.ReactNode {
  const { data: users, reload } = useAdminGet<Paginated<UserRow>>("/admin/users?perPage=50");
  const { data: roles } = useAdminGet<RoleRow[]>("/admin/roles");
  const request = useAdminRequest();
  const [form, setForm] = useState(EMPTY_USER);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    try {
      await request("/admin/users", "POST", form);
      setForm(EMPTY_USER);
      await reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al crear el usuario");
    }
  }

  async function toggleActive(user: UserRow): Promise<void> {
    try {
      await request(`/admin/users/${user.id}`, "PUT", { isActive: !user.isActive });
      await reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Error");
    }
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await request(`/admin/users/${id}`, "DELETE");
      await reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card title="Usuarios internos (máx. 15 activos)">
        {!users || users.data.length === 0 ? (
          <EmptyState message="Sin usuarios" />
        ) : (
          <Table headers={["Usuario", "Rol", "Estado", "Acciones"]}>
            {users.data.map((user) => (
              <tr key={user.id} className="border-b border-stone-50">
                <td className="px-3 py-2">
                  <p className="flex items-center gap-1.5 font-medium text-navy-900">
                    {user.firstName} {user.lastName}
                    {user.isSuperadmin && <IconShieldCheck size={15} className="text-amber-500" />}
                  </p>
                  <p className="text-xs text-stone-400">{user.email}</p>
                </td>
                <td className="px-3 py-2">{user.isSuperadmin ? <Badge tone="warning">Superadmin</Badge> : (user.role?.name ?? "—")}</td>
                <td className="px-3 py-2">{user.isActive ? <Badge tone="success">Activo</Badge> : <Badge tone="danger">Suspendido</Badge>}</td>
                <td className="px-3 py-2">
                  {!user.isSuperadmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" title={user.isActive ? "Suspender" : "Reactivar"} onClick={() => void toggleActive(user)}>
                        {user.isActive ? <IconPause size={15} /> : <IconPlay size={15} />}
                      </Button>
                      <Button variant="ghost" onClick={() => void remove(user.id)}>
                        <IconTrash size={15} />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Nuevo usuario">
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre *">
              <input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Apellido *">
              <input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Correo *">
            <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Contraseña inicial *">
            <input type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Rol *">
            <select required value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} className={inputClass}>
              <option value="">Selecciona…</option>
              {(roles ?? []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <Button type="submit">Crear usuario</Button>
        </form>
      </Card>
    </div>
  );
}

function RolesTab(): React.ReactNode {
  const { data: roles, reload } = useAdminGet<RoleRow[]>("/admin/roles");
  const { data: permissions } = useAdminGet<PermissionRow[]>("/admin/roles/permissions");
  const request = useAdminRequest();
  const [form, setForm] = useState<{ name: string; description: string; permissionKeys: string[] }>({ name: "", description: "", permissionKeys: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    try {
      if (editingId) await request(`/admin/roles/${editingId}`, "PUT", form);
      if (!editingId) await request("/admin/roles", "POST", form);
      setForm({ name: "", description: "", permissionKeys: [] });
      setEditingId(null);
      await reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  function togglePermission(key: string): void {
    setForm((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(key)
        ? current.permissionKeys.filter((existing) => existing !== key)
        : [...current.permissionKeys, key]
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card title="Roles">
        {!roles || roles.length === 0 ? (
          <EmptyState message="Sin roles" />
        ) : (
          <ul className="space-y-3">
            {roles.map((role) => (
              <li key={role.id} className="rounded-xl border border-stone-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-navy-900">
                      {role.name} {role.isSystem && <Badge tone="info">Sistema</Badge>}
                    </p>
                    {role.description && <p className="text-sm text-stone-500">{role.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-400">
                    {role._count.users} usuarios
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(role.id);
                        setForm({
                          name: role.name,
                          description: role.description ?? "",
                          permissionKeys: role.permissions.map((link) => link.permission.key)
                        });
                      }}
                    >
                      <IconPencil size={15} />
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          void request(`/admin/roles/${role.id}`, "DELETE")
                            .then(reload)
                            .catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Error"));
                        }}
                      >
                        <IconTrash size={15} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {role.permissions.map((link) => (
                    <Badge key={link.permission.key}>{link.permission.key}</Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={editingId ? "Editar rol" : "Nuevo rol"}>
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <Field label="Nombre *">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Descripción">
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass} />
          </Field>
          <p className="text-sm font-medium text-stone-700">Permisos</p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-3">
            {(permissions ?? []).map((permission) => (
              <label key={permission.key} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permissionKeys.includes(permission.key)}
                  onChange={() => togglePermission(permission.key)}
                  className="mt-0.5 accent-brand-600"
                />
                <span>
                  <span className="font-mono text-xs text-brand-700">{permission.key}</span>
                  {permission.description && <span className="block text-xs text-stone-400">{permission.description}</span>}
                </span>
              </label>
            ))}
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Guardar" : "Crear rol"}</Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", description: "", permissionKeys: [] });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
