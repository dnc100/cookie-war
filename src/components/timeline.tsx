export function BattleTimeline({
  submissionDeadline,
  tasteDay,
  resultsDay,
}: {
  submissionDeadline: string;
  tasteDay: string;
  resultsDay: string;
}) {
  const steps = [
    { label: "Submission deadline", date: submissionDeadline, detail: "Get your batch on the roster" },
    { label: "Taste Day", date: tasteDay, detail: "Neighbors taste anonymously" },
    { label: "Results", date: resultsDay, detail: "The winner is revealed" },
  ];

  return (
    <ol className="mt-8 grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.label} className="relative rounded-3xl border border-[#ead8c2] bg-[#fffaf3] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e59a36] text-sm font-black text-white">
              {index + 1}
            </span>
            <span className="text-sm font-black text-[#81451f]">{step.date}</span>
          </div>
          <h3 className="mt-5 font-black">{step.label}</h3>
          <p className="mt-1 text-sm text-[#866b58]">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
