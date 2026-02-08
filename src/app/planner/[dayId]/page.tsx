import DayPlannerPageLoader from "@/components/DayPlannerPageLoader";

export default async function PlannerPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  return <DayPlannerPageLoader dayId={dayId} />;
}
