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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader>
        <CardTitle>Matrix Preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter a hypothetical amount to see which signatory combinations would satisfy the rules.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Amount in PHP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-auto">
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              Preview
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={data.canApprove ? "default" : "destructive"}>
                {data.canApprove ? "Can Approve" : "Cannot Approve"}
              </Badge>
              <span className="text-sm text-muted-foreground">{data.summary}</span>
            </div>

            {data.applicableRules.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Applicable Rules</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {data.applicableRules.map((rule) => (
                    <li key={rule.id}>
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
                <p className="mb-2 text-sm font-medium">Valid Combinations</p>
                <ul className="space-y-2">
                  {data.validCombinations.map((combo, i) => (
                    <li key={i} className="rounded-md border p-3 text-sm">
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
