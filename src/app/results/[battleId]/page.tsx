import { DashboardShell } from "../../../components/dashboard-shell";
import { ResultsPage } from "../../../components/results-page";
import { calculateWinner } from "../../../lib/calculate-winner";

export const instant = false;

export default async function ResultsRoute({
  params,
}: {
  params: Promise<{ battleId: string }>;
}) {
  const { battleId } = await params;
  const results = await calculateWinner(battleId);

  return (
    <DashboardShell role="TASTER" eyebrow="The Cozy Crunch · Results Day" title="Every cookie has a story.">
      <div className="mt-8">
        <ResultsPage entries={results} />
      </div>
    </DashboardShell>
  );
}
