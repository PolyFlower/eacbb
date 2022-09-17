import { constants } from "fs";
import { FileHandle, access, open, readFile } from "fs/promises";

export namespace Utils {
  export namespace File {
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
}
