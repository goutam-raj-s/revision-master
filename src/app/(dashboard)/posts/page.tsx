import { getPostDraftsAction } from "@/actions/posts";
import { PostsClient } from "@/components/features/posts-client";

export const metadata = { title: "Posts" };

export default async function PostsPage() {
  const drafts = await getPostDraftsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Posts</h1>
        <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">Draft, schedule and track posts about what you learn.</p>
      </div>
      <PostsClient initial={drafts} />
    </div>
  );
}
