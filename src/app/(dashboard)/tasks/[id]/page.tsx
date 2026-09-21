import { notFound } from "next/navigation";
import { getTaskByIdAction } from "@/actions/tasks";
import { TaskDetailClient } from "@/components/features/task-detail-client";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const task = await getTaskByIdAction(id);
  return { title: task ? `${task.title} — lostbae` : "Task — lostbae" };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const task = await getTaskByIdAction(id);
  if (!task) notFound();

  return <TaskDetailClient task={task} />;
}
