import { TaskDetailOfflinePage } from "@/components/features/task-detail-offline-page";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Task — lostbae" };

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  return <TaskDetailOfflinePage taskId={id} />;
}
