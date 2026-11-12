import { DashboardShell } from "../../../../../components/dashboard-shell";
import { TastingRoom } from "../../../../../components/tasting-room";

export const instant = false;

export default async function TastingRoomPage({
  params,
}: {
  params: Promise<{ battleId: string }>;
}) {
  const { battleId } = await params;

  return (
    <DashboardShell role="TASTER" eyebrow="Taste Day · The Cozy Crunch" title="Welcome to the tasting room.">
      <div className="mx-auto mt-8 max-w-2xl">
        <TastingRoom battleId={battleId} />
      </div>
    </DashboardShell>
  );
}
