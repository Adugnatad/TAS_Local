import { redirect } from "next/navigation";

export default function SignatoryCustomerRedirect({
  params,
}: {
  params: { customerId: string };
}) {
  redirect(`/organizations/${params.customerId}/signatory/groups`);
}
