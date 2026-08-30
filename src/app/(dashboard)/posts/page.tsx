import { getPostDraftsAction } from "@/actions/posts";
import { getSocialConnectionsAction } from "@/actions/social";
import { PostsClient } from "@/components/features/posts-client";

export const metadata = { title: "Social" };

export default async function PostsPage() {
  const [drafts, social] = await Promise.all([
    getPostDraftsAction(),
    getSocialConnectionsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Social</h1>
        <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">Run account-specific publishing, comments, reactions and tracking from one place.</p>
      </div>
      <PostsClient
        initial={drafts}
        connections={social.connections}
        configured={social.configured}
      />
    </div>
  );
}
