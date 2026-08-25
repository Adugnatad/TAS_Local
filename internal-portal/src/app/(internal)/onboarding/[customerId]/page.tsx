import { redirect } from "next/navigation";

export default function OnboardingDetailRedirect({
  params,
}: {
  params: { customerId: string };
}) {
  redirect(`/organizations/${params.customerId}`);
}
