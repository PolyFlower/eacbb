import { createHash } from "crypto";

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
