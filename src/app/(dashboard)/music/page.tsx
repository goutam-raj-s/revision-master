import { getUserAudioDocuments, getUserPlaylists } from "@/actions/audio";
import { MusicLibraryClient } from "@/components/features/music-library-client";

export default async function MusicPage() {
  const [docs, playlists] = await Promise.all([
    getUserAudioDocuments(),
    getUserPlaylists(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-slate">Music Library</h1>
        <p className="text-mossy-gray text-sm mt-1">Your uploaded audio files and playlists</p>
      </div>
      <MusicLibraryClient initialDocs={docs} initialPlaylists={playlists} />
    </div>
  );
}
