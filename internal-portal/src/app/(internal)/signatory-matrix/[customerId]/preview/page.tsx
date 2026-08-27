import { redirect } from "next/navigation";

export default function SignatoryPreviewLegacyRedirect({
  params,
}: {
  params: { customerId: string };
}) {
  redirect(`/organizations/${params.customerId}/signatory/groups`);
}
