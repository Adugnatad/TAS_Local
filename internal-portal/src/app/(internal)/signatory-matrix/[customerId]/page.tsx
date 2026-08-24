import { redirect } from "next/navigation";

export default function CustomerMatrixIndexPage({
  params,
}: {
  params: { customerId: string };
}) {
  redirect(`/signatory-matrix/${params.customerId}/signatories`);
}
