// Artwork Conversion

/** Accepts a url with '{w}' and '{h}' and replaces them with the specified size */
export const getAppleArtwork = (size: number | string, url?: string) => {
  if (!url) {
    return undefined;
  }

  return url.replace("{w}", `${size || 100}`).replace("{h}", `${size || 100}`);
};

export const convertAppleSong = (data: AppleMusicApi.Song): MediaApi.Song => ({
  id: data.id,
  name: data.attributes?.name ?? "Unknown name",
  url: data.href ?? "",
  artwork: { url: data.attributes?.artwork?.url ?? "" },
  albumName: data.attributes?.albumName,
  artistName: data.attributes?.artistName,
  duration: data.attributes?.durationInMillis ?? 0,
  trackNumber: data.attributes?.trackNumber ?? 0,
});

// Playlist Conversion

export const convertApplePlaylist = (
  data: AppleMusicApi.Playlist
): MediaApi.Playlist => ({
  id: data.id,
  name: data.attributes?.name ?? "–",
  url: data.href ?? "",
  curatorName: data.attributes?.curatorName ?? "",
  artwork: {
    url: data.attributes?.artwork?.url ?? "",
  },
  description: data.attributes?.description?.standard,
  songs: data.relationships?.tracks?.data.map(convertAppleSong) ?? [],
});

export const convertAppleAlbum = (
  data: AppleMusicApi.Album
): MediaApi.Album => ({
  id: data.id,
  name: data.attributes?.name ?? "–",
  artistName: data.attributes?.artistName,
  url: data.href ?? "",
  artwork: {
    url: data.attributes?.artwork?.url ?? "",
  },
  songs: data.relationships?.tracks?.data?.map(convertAppleSong) ?? [],
});

export const convertAppleArtist = (
  data: AppleMusicApi.Artist
): MediaApi.Artist => ({
  id: data.id,
  name: data.attributes?.name ?? "–",
  url: data.attributes?.url ?? "",
  albums: data.relationships?.albums?.data.map(convertAppleAlbum) ?? [],
});

export const convertAppleMediaItem = (
  mediaItem: MusicKit.MediaItem
): MediaApi.MediaItem => ({
  albumName: mediaItem.albumName,
  artistName: mediaItem.artistName,
  artwork: {
    url: mediaItem.artworkURL ?? "",
  },
  duration: mediaItem.playbackDuration,
  id: mediaItem.id,
  name: mediaItem.title,
  trackNumber: mediaItem.trackNumber,
  url: "",
});

export const convertAppleSearchResults = (
  search: AppleMusicApi.SearchResponse
): MediaApi.SearchResults => {
  const { results } = search;

  return {
    artists: results.artists?.data.map(convertAppleArtist) ?? [],
    albums: results.albums?.data.map((album) => convertAppleAlbum(album)) ?? [],
    songs: results.songs?.data.map(convertAppleSong) ?? [],
    playlists: results.playlists?.data.map(convertApplePlaylist) ?? [],
  };
};
