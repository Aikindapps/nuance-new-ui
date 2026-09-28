import { useCallback } from "react";
import { useActors } from "../../../contexts/useActors";
import { writeArticleCopy } from "../../../constants/copy";

const MAX_CHUNK_SIZE = (1024 * 1024 * 3) / 2; // 1.5 MB (NIC-528, see below)
const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10 MB cap per image (PR #9 review m1)

// Uploads an image to the Storage canister in 1.5 MB chunks and returns its
// public URL. Mirrors the production storageService chunking exactly: offset
// starts at 1, and the first chunk's response is the data-canister id. This
// project always talks to the mainnet Storage canister — even locally
// (decisions #5/#30) — so the URL is always the mainnet raw form, matching the
// legacy `…raw.icp0.io/storage?contentId=` images seen in the round-trip probe.
// NIC-528 -- pieces must stay well under the IC's 2 MiB whole-message limit:
// a full 2 MiB piece plus the call envelope exceeds 2 MiB and is refused with
// HTTP 413 on the first piece. The Storage canister stores pieces by number,
// so the piece size is otherwise free to choose.
export function useImageUpload() {
  const { getNewContentId, uploadBlob } = useActors();

  return useCallback(
    async (file: File): Promise<string> => {
      if (file.size === 0) throw new Error("Empty file");
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(writeArticleCopy.toasts.imageTooLarge);
      }

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
