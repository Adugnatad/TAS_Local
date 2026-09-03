"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useApprovalTemplates, useMatrixMutations } from "../hooks";
import type { SignatoryGroup } from "../types";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ApplyTemplateDialog({
  orgId,
  open,
  onOpenChange,
  groups,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SignatoryGroup[];
}) {
  const templates = useApprovalTemplates();
  const mutations = useMatrixMutations(orgId);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [defaultGroupId, setDefaultGroupId] = useState<string>("");

  async function onApply() {
    if (!selectedCode || !defaultGroupId) {
      toast.error("Select a template and default signatory group.");
      return;
    }
    try {
      const created = await mutations.applyTemplate.mutateAsync({
        code: selectedCode,
        defaultSignatoryGroupId: defaultGroupId,
      });
      toast.success(`Applied template — ${created.length} rule(s) created.`);
      onOpenChange(false);
      setSelectedCode("");
      setDefaultGroupId("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Apply failed.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply approval policy template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Template</Label>
            <Select value={selectedCode || undefined} onValueChange={(v) => v && setSelectedCode(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {(templates.data ?? []).map((template) => (
                  <SelectItem key={template.code} value={template.code}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCode && (
              <p className="text-sm text-muted-foreground">
                {templates.data?.find((t) => t.code === selectedCode)?.description}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Default signatory group</Label>
            <Select
              value={defaultGroupId || undefined}
              onValueChange={(v) => v && setDefaultGroupId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void onApply()} disabled={mutations.applyTemplate.isPending}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
