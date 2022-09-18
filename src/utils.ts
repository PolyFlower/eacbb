import { constants } from "fs";
import { FileHandle, access, open, readFile } from "fs/promises";
import axios, { AxiosRequestHeaders } from "axios";
import { randomUUID } from "crypto";

export namespace Utils {
  export namespace FileSystem {
    /**
     * Opens handle with read permission to file at `path`.
     * @param [path] Path to file.
     * @return Valid handle or null otherwise.
     */
    export async function OpenHandle(path: string): Promise<FileHandle> {
      const hasAccess: boolean = await access(path, constants.R_OK)
        .then(() => true)
        .catch(() => false);
      if (hasAccess) {
        const handle: FileHandle = await open(path, "r");
        return handle;
      }
      return null;
    }

    /**
     * Reads file image from opened `handle` into `byteStream`
     * @param [handle] File handle to be read from
     * @return Buffer containing file image
     */
    export async function CreateByteStream(handle: FileHandle): Promise<Buffer> {
      const byteStream: Buffer = await readFile(handle);
      return byteStream;
    }

    /**
     * Verifies PE signature by comparing `signature` bytes with `fileBuffer`.
     * @param [fileBuffer] Buffer containing file image
     * @param [signature] Signature string https://en.wikipedia.org/wiki/List_of_file_signatures
     * @return Boolean indicating verification result
     */
    export function VerifySignature(fileBuffer: Buffer, signature: string): boolean {
      const signatureBuffer: Buffer = Buffer.alloc(signature.length, 0);
      fileBuffer.copy(signatureBuffer, 0, 0, signature.length);
      return signatureBuffer.compare(Buffer.from(signature)) == 0 ? true : false;
    }
  }
  export namespace Memory {
    /**
     * @param {Buffer} [fileBuffer] Buffer with image
     * @param {number} [size=fileBuffer.byteLength] Size of image
     * @param {string} [bMask] Byte signature pattern
     * @param {string} [mask] Mask with same length as 'sig'
     * @return {number} Offset to found sequance in number of bytes
     */
    export function FindPattern(fileBuffer: Buffer, size: number, bMask: string, mask: string): number {
      const bMaskLen: number = bMask.length;
      size -= bMaskLen;
      const bMaskBuffer: Buffer = Buffer.from(bMask, "latin1"); // Don't ask why. Hint: (unsigned char* left the game)
      for (var offset = 0; offset < size; ++offset) {
        var currentBuffer: Buffer = Buffer.alloc(bMaskLen);
        currentBuffer = fileBuffer.slice(offset, offset + bMaskLen);
        if (CheckMask(currentBuffer, bMaskBuffer, mask)) {
          return offset;
        }
      }
    }

    /**
     * Local util function to check mask
     * @param {Buffer} [currentBuffer] Buffer with source bytes
     * @param {Buffer} [bMaskBuffer] Buffer with byte mask
     * @param {string} [mask] String with mask ex. "xxx??xxx"
     * @return {boolean} Returns boolean indicating if mask can be applied
     */
    function CheckMask(currentBuffer: Buffer, bMaskBuffer: Buffer, mask: string): boolean {
      for (var bufferIdx = 0, maskIdx = 0, bMaskIdx = 0; mask[maskIdx]; ++bufferIdx, ++maskIdx, ++bMaskIdx) {
        if ("x" == mask[bMaskIdx] && currentBuffer[bufferIdx] != bMaskBuffer[bMaskIdx]) {
          return false;
        }
      }
      return true;
    }
  }

  export namespace Network {
    /**
     * Fetch specified `gameId` encrypted cache file from EAC's CDN
     * @param {number} [gameId] Game ID to download cache for
     * @param {string} [platform] Represents cache file platform (ex. wow64_win64 | wow32_win32 | wine32 | wine64 )
     * @return {Buffer} Returns buffer with cache file
     */
    export async function DownloadCDNCache(gameId: number, platform: string): Promise<Buffer> {
      const eacHeader: AxiosRequestHeaders = {
        "User-Agent": "EasyAntiCheat-Client/1.0",
        // prettier-ignore
        "Accept": "application/octet-stream",
        "Accept-Encoding": "identity",
        "Cache-Control": "max-age=0",
        "If-None-Match": "No update needed.",
      };
      const uuid = randomUUID();
      const cdnFileBuffer: Buffer = await axios
        .get(`https://download.eac-cdn.com/api/v1/games/${gameId}/client/${platform}/download/?uuid=${uuid}`, {
          headers: eacHeader,
          responseType: "arraybuffer",
          timeout: 2000,
        })
        .then((response) => Buffer.from(response.data));
      return cdnFileBuffer;
    }
  }
}
