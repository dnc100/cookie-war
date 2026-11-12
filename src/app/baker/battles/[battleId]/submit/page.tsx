import Link from "next/link";
import { CookieSubmissionForm } from "../../../../../components/cookie-submission-form";
import { DashboardShell } from "../../../../../components/dashboard-shell";

export const instant = false;

export default async function CookieSubmissionPage({
  params,
}: {
  params: Promise<{ battleId: string }>;
}) {
  const { battleId } = await params;

  return (
    <DashboardShell role="BAKER" eyebrow="Competition · Baker entry" title="Bring your best batch.">
      <div className="mx-auto max-w-3xl">
        <Link href="/baker/dashboard" className="text-sm font-black text-[#a75c2b]">← Back to dashboard</Link>
        <p className="mt-4 max-w-xl text-lg leading-7 text-[#866b58]">A few details help us prepare a safe, anonymous tasting experience for everyone.</p>
        <div className="mt-10">
          <CookieSubmissionForm battleId={battleId} />
        </div>
      </div>
    </DashboardShell>
  );
}
