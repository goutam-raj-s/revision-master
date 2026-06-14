import { getPostDraftsAction } from "@/actions/posts";
import { getSocialConnectionsAction } from "@/actions/social";
import { PostsClient } from "@/components/features/posts-client";

export const metadata = { title: "Posts" };

export default async function PostsPage() {
  const [drafts, social] = await Promise.all([
    getPostDraftsAction(),
    getSocialConnectionsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Posts</h1>
        <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">Draft, schedule and publish posts about what you learn — directly from here.</p>
      </div>
      <PostsClient
        initial={drafts}
        connections={social.connections}
        configured={social.configured}
      />
    </div>
  );
}
