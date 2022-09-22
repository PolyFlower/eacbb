import axios, { AxiosRequestHeaders } from "axios";
import { randomUUID, createHash } from "crypto";

export namespace Utils {
  export namespace FileSystem {
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

  export namespace Crypto {
    /**
     * Decrypts .eac cache file byte buffer.
     *
     * Essentially it's a void func. Just decrypt.
     * @param {Buffer} [image] Encrypted image byte buffer to decrypt.
     * @param {number} [imageSize] Length in bytes to decrypt. Original have that because of excessive memory allocations (half of image can be zeroed out)
     */
    export function DecryptCache(image: Buffer, imageSize: number): void {
      /* eac_x86.dll: .text:6C1C4990
      {
       unsigned int v2; // eax
       if ( imageSize >= 2 )
       {
         image[imageSize - 1] += 3 - 3 * imageSize;
         v2 = imageSize - 2;
         if ( imageSize != 2 )
         {
           do
           {
              image[v2] += -3 * v2 - image[v2 + 1];
              --v2;
           }
           while ( v2 );
          }
          *image -= image[1];
        }
      } */
      var v2: number;
      if (imageSize >= 2) {
        image[imageSize - 1] += 3 - 3 * imageSize;
        v2 = imageSize - 2;
        if (imageSize != 2) {
          do {
            image[v2] += -3 * v2 - image[v2 + 1];
            --v2;
          } while (v2);
        }
        image[0] -= image[1];
      }
    }

    /**
     * Encrypt using .eac cache encryption.
     * @param {Buffer} [image] Image byte buffer to encrypt.
     * @param {number} [imageSize] Length in bytes to encrypt.
     */
    export function EncryptCache(image: Buffer, imageSize: number): void {
      var v2: number;
      if (imageSize >= 2) {
        image[imageSize - 1] += 3 - 3 * imageSize;
        v2 = 0;
        if (imageSize != 2) {
          do {
            image[v2] -= -3 * v2 - image[v2 + 1];
            ++v2;
          } while (v2 < imageSize);
        }
        // image[0] -= image[1];
      }
    }

    /**
     * Computes SHA1 hash for cache like EAC does
     * @param {Buffer} [buffer] Cache file buffer
     * @return {string} Returns hash string in hex
     */
    export function GetSHA1Hash(buffer: Buffer): string {
      return createHash("sha1").update(buffer).digest("hex");
    }
  }
}
