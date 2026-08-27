import { redirect } from "next/navigation";

export default function SignatoryRulesLegacyRedirect({
  params,
}: {
  params: { customerId: string };
}) {
  redirect(`/organizations/${params.customerId}/signatory/rules`);
}
