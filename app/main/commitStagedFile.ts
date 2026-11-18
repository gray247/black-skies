import fs from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

/** Keep the destination intact while retrying a short sharing lock. The
 * caller must serialize writes, own the staged file, and handle cleanup.
 */
export async function commitStagedFile(stagedPath: string, destination: string): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await fs.rename(stagedPath, destination);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt === 3 || !['EPERM', 'EACCES', 'EBUSY'].includes(code ?? '')) throw error;
      await delay(25 * attempt);
    }
  }
}
