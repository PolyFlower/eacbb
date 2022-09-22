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
