import { DashboardShell } from "../../../components/dashboard-shell";
import Link from "next/link";

export default function TasterPreferencesPage() {
  return (
    <DashboardShell role="TASTER" eyebrow="Taster dashboard" title="Your tasting preferences.">
      <section className="mt-8 max-w-2xl rounded-[2.5rem] border border-[#ead8c2] bg-[#fffaf3] p-7 sm:p-9">
        <p className="text-sm leading-6 text-[#866b58]">
          Your location and allergy details are saved separately for each competition, so you can choose a different pickup point when needed.
        </p>
        <Link href="/taster/dashboard" className="mt-8 inline-flex rounded-full bg-[#d8ff88] px-5 py-3 text-sm font-black text-[#49391c]">
          Choose a competition
        </Link>
      </section>
    </DashboardShell>
  );
}
