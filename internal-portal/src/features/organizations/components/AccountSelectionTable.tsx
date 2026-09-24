"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AccountSelectionRow {
  accountNo: string;
  currency?: string | null;
  accountType?: string | null;
  status?: string | null;
  alreadyLinked?: boolean;
}

function displayValue(value: string | null | undefined) {
  return value ?? "—";
}

export function AccountSelectionTable({
  accounts,
  selectedAccountNos,
  onToggle,
  disabledAccountNos,
}: {
  accounts: AccountSelectionRow[];
  selectedAccountNos: Set<string>;
  onToggle: (accountNo: string, checked: boolean) => void;
  disabledAccountNos?: Set<string>;
}) {
  if (!accounts.length) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">Use</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const isDisabled = disabledAccountNos?.has(account.accountNo) ?? false;
          const isChecked = selectedAccountNos.has(account.accountNo) || isDisabled;
          return (
            <TableRow key={account.accountNo}>
              <TableCell>
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) => onToggle(account.accountNo, e.target.checked)}
                  aria-label={`Select account ${account.accountNo}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                {account.accountNo}
                {account.alreadyLinked && (
                  <span className="ml-2 text-xs text-muted-foreground">(linked)</span>
                )}
              </TableCell>
              <TableCell>{displayValue(account.currency)}</TableCell>
              <TableCell>{displayValue(account.accountType)}</TableCell>
              <TableCell>{displayValue(account.status)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
