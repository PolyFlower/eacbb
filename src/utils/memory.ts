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
