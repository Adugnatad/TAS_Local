import { redirect } from "next/navigation";

export default function SignatoryIndex({ params }: { params: { id: string } }) {
  redirect(`/organizations/${params.id}/signatory/groups`);
}
