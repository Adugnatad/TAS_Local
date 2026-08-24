"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useMatrixPreview } from "../hooks/useSignatories";
import { matrixPreviewSchema, type MatrixPreviewFormValues } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface MatrixPreviewProps {
  customerId: string;
}

export function MatrixPreview({ customerId }: MatrixPreviewProps) {
  const [previewAmount, setPreviewAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<MatrixPreviewFormValues>({
    resolver: zodResolver(matrixPreviewSchema),
    defaultValues: { amount: 1000000 },
  });

  const { data, isLoading, isFetching } = useMatrixPreview(
    customerId,
    previewAmount,
    submitted && previewAmount > 0,
  );

  function onSubmit(values: MatrixPreviewFormValues) {
    setPreviewAmount(values.amount);
    setSubmitted(true);
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Matrix preview</CardTitle>
        <CardDescription>
          Test an amount against this customer’s signatories and rules before a live request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Request amount (PHP)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1,000,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              Preview combinations
            </Button>
          </form>
        </Form>

        {submitted && (isLoading || isFetching) && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {submitted && data && !isLoading && (
          <div className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={data.canApprove ? "default" : "destructive"}>
                {data.canApprove ? "Can Approve" : "Cannot Approve"}
              </Badge>
              <span className="text-sm text-muted-foreground">{data.summary}</span>
            </div>

            {data.applicableRules.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Applicable rules
                </p>
                <ul className="space-y-1.5 text-sm text-foreground/90">
                  {data.applicableRules.map((rule) => (
                    <li key={rule.id} className="rounded-md border bg-card px-3 py-2">
                      ≥ {formatCurrency(rule.amountThreshold)}: min {rule.minSignatories} signator
                      {rule.minSignatories > 1 ? "ies" : "y"}
                      {rule.requiredRoles?.length
                        ? ` including ${rule.requiredRoles.join(", ")}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.validCombinations.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Valid combinations
                </p>
                <ul className="space-y-2">
                  {data.validCombinations.map((combo, i) => (
                    <li key={i} className="rounded-md border bg-card px-3 py-2.5 text-sm">
                      {combo.signatories.map((s) => `${s.fullName} (${s.role})`).join(" + ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No valid signatory combinations found for {formatCurrency(previewAmount)}.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
