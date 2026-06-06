import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppLayoutShell } from "@/components/layout/app-layout-shell";
import { PageContent } from "@/components/layout/page-content";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=%2Ftimer");
  }
  return (
    <AppLayoutShell session={session}>
      <PageContent>{children}</PageContent>
    </AppLayoutShell>
  );
}
