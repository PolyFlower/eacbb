import axios, { AxiosRequestHeaders } from "axios";
import { randomUUID } from "crypto";

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
