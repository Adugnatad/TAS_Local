"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { officerSchema, type OfficerFormValues } from "@/features/auth/schemas";
import type { Officer } from "@/features/auth/types";
import { useSession } from "@/features/auth/hooks/useSession";
import {
  useCreateOfficer,
  useDeleteOfficer,
  useOfficers,
  useUpdateOfficer,
} from "@/features/auth/hooks/useOfficers";
import { OFFICER_ROLES, ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormSection } from "@/components/ui/form-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

function UserForm({ officer, onClose }: { officer?: Officer; onClose: () => void }) {
  const createMutation = useCreateOfficer();
  const updateMutation = useUpdateOfficer();
  const isEdit = !!officer;
  const form = useForm<OfficerFormValues>({
    resolver: zodResolver(officerSchema),
    defaultValues: {
      name: officer?.name ?? "",
      email: officer?.email ?? "",
      role: officer?.role ?? "officer",
      phone: officer?.phone ?? "",
      department: officer?.department ?? "",
      isActive: officer?.isActive ?? true,
    },
  });

  async function onSubmit(values: OfficerFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ userId: officer.id, input: values });
        toast.success("User updated.");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("User created.");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save user.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Identity" columns={2}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+63 917 000 0000" {...field} autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Corporate Onboarding" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        <FormSection title="Access" columns={2}>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portal role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Portal role">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OFFICER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Determines what this user can change in the portal.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="justify-end">
                <FormLabel>Status</FormLabel>
                <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm">
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    aria-label="Active account"
                  />
                  Active — can sign in
                </label>
              </FormItem>
            )}
          />
        </FormSection>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? "Save user" : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent className="pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function UserManagement() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Officer | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Officer | undefined>();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading, isError, refetch } = useOfficers();
  const updateMutation = useUpdateOfficer();
  const deleteMutation = useDeleteOfficer();

  const activeAdminCount = data?.filter((item) => item.role === "admin" && item.isActive).length ?? 0;

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.department ?? "").toLowerCase().includes(query);
      const matchesRole = !role || item.role === role;
      const matchesStatus =
        !status || (status === "active" ? item.isActive : !item.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [data, search, role, status]);

  function isLastActiveAdmin(officer: Officer) {
    return officer.role === "admin" && officer.isActive && activeAdminCount <= 1;
  }

  async function toggleActive(officer: Officer) {
    try {
      await updateMutation.mutateAsync({
        userId: officer.id,
        input: { isActive: !officer.isActive },
      });
      toast.success(officer.isActive ? "User deactivated." : "User activated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success("User removed.");
      setPendingDelete(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user.");
    }
  }

  function closeForm() {
    setOpen(false);
    setEditing(undefined);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Create portal accounts, assign roles, and deactivate access for bank officers."
        actions={
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) setEditing(undefined);
            }}
          >
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Add user</Button>} />
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update this officer’s identity, department, and portal role."
                    : "New users can sign in with the assigned role on the mock login screen."}
                </DialogDescription>
              </DialogHeader>
              <UserForm key={editing?.id ?? "new"} officer={editing} onClose={closeForm} />
            </DialogContent>
          </Dialog>
        }
      />

      {data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total users" value={data.length} />
          <Stat label="Active" value={data.filter((item) => item.isActive).length} />
          <Stat label="Officers" value={data.filter((item) => item.role === "officer").length} />
          <Stat label="Administrators" value={data.filter((item) => item.role === "admin").length} />
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="user-search" className="text-muted-foreground">
              Search
            </Label>
            <Input
              id="user-search"
              placeholder="Name, email, or department"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search users"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Role</Label>
            <Select
              value={role || "all"}
              onValueChange={(value) => {
                if (!value) return;
                setRole(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {OFFICER_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Status</Label>
            <Select
              value={status || "all"}
              onValueChange={(value) => {
                if (!value) return;
                setStatus(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <TableSkeleton rows={6} columns={7} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title="No users found"
          description="Try a different search, or add a portal user."
        />
      )}
      {!isLoading && !isError && filtered.length > 0 && (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((officer) => {
                const isSelf = user?.id === officer.id;
                const lastAdmin = isLastActiveAdmin(officer);
                return (
                  <TableRow key={officer.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {officer.name}
                          {isSelf && (
                            <Badge variant="outline" className="ml-2 align-middle">
                              You
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{officer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{ROLE_LABELS[officer.role]}</TableCell>
                    <TableCell>{officer.department ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={officer.isActive ? "default" : "secondary"}>
                        {officer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {officer.lastLoginAt ? formatDate(officer.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(officer);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf || (officer.isActive && lastAdmin)}
                          title={
                            isSelf
                              ? "You cannot deactivate your own account."
                              : lastAdmin
                                ? "At least one active administrator is required."
                                : undefined
                          }
                          onClick={() => toggleActive(officer)}
                        >
                          {officer.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={isSelf || lastAdmin}
                          title={
                            isSelf
                              ? "You cannot delete your own account."
                              : lastAdmin
                                ? "At least one active administrator is required."
                                : undefined
                          }
                          onClick={() => setPendingDelete(officer)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(value) => !value && setPendingDelete(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove user</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} will be removed from the portal directory and will no longer be able to sign in.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(undefined)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
