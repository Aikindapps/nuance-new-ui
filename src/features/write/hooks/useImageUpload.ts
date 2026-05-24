import { useCallback } from "react";
import { useActors } from "../../../contexts/useActors";

const MAX_CHUNK_SIZE = 1024 * 1024 * 2; // 2 MB — matches production storageService

// Uploads an image to the Storage canister in 2 MB chunks and returns its
// public URL. Mirrors the production storageService chunking exactly: offset
// starts at 1, and the first chunk's response is the data-canister id. This
// project always talks to the mainnet Storage canister — even locally
// (decisions #5/#30) — so the URL is always the mainnet raw form, matching the
// legacy `…raw.icp0.io/storage?contentId=` images seen in the round-trip probe.
export function useImageUpload() {
  const { getNewContentId, uploadBlob } = useActors();

  return useCallback(
    async (file: File): Promise<string> => {
      if (file.size === 0) throw new Error("Empty file");

      const idResult = await getNewContentId();
      if (idResult.__kind__ === "err") throw new Error(idResult.err);
      const contentId = idResult.ok;

      const size = file.size;
      const totalChunks = Math.ceil(size / MAX_CHUNK_SIZE);
      let dataCanisterId = "";
      let offset = 1;
      for (
        let byteStart = 0;
        byteStart < size;
        byteStart += MAX_CHUNK_SIZE, offset++
      ) {
        const slice = file.slice(
          byteStart,
          Math.min(size, byteStart + MAX_CHUNK_SIZE),
          file.type,
        );
        const buffer = await slice.arrayBuffer();
        const res = await uploadBlob({
          contentId,
          contentSize: BigInt(size),
          mimeType: file.type,
          offset: BigInt(offset),
          totalChunks: BigInt(totalChunks),
          chunkData: new Uint8Array(buffer),
        });
        if (res.__kind__ === "err") throw new Error(res.err);
        if (byteStart === 0) dataCanisterId = res.ok;
      }

      return `https://${dataCanisterId}.raw.icp0.io/storage?contentId=${contentId}`;
    },
    [getNewContentId, uploadBlob],
  );
}
