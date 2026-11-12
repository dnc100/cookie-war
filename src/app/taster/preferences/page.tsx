import Link from "next/link";
import { DashboardShell } from "../../../components/dashboard-shell";

export default function TasterPreferencesPage() {
  return (
    <DashboardShell role="TASTER" eyebrow="Taster dashboard" title="Your tasting preferences.">
      <section className="mt-8 max-w-2xl rounded-[2.5rem] border border-[#ead8c2] bg-[#fffaf3] p-7 sm:p-9">
        <p className="text-sm leading-6 text-[#866b58]">
          These preferences help us match you with cookies that are safe and exciting to taste.
        </p>
        <div className="mt-7 space-y-5">
          <div>
            <p className="text-sm font-black text-[#4c2b1d]">Pickup location</p>
            <p className="mt-1 text-sm text-[#866b58]">Maple Street Kitchen</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#4c2b1d]">Allergy restrictions</p>
            <p className="mt-1 text-sm text-[#866b58]">Peanuts · Tree nuts</p>
          </div>
          <div>
            <p className="text-sm font-black text-[#4c2b1d]">Favorite textures and flavors</p>
            <p className="mt-1 text-sm text-[#866b58]">Chewy · Cinnamon · Chocolate</p>
          </div>
        </div>
        <Link href="/taster/dashboard" className="mt-8 inline-flex rounded-full bg-[#d8ff88] px-5 py-3 text-sm font-black text-[#49391c]">
          Back to dashboard
        </Link>
      </section>
    </DashboardShell>
  );
}
