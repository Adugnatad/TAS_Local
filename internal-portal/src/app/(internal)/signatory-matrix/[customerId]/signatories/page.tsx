import { redirect } from "next/navigation";

export default function SignatoryLegacyRedirect({
  params,
}: {
  params: { customerId: string };
}) {
  redirect(`/organizations/${params.customerId}/signatory/groups`);
}
