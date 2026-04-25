import { env } from "../env.js";
import type { StorageDriver } from "./driver.js";
import { localDriver } from "./local.js";
import { s3Driver } from "./s3.js";

/**
 * Singleton driver selected from `UPLOADS_DRIVER`. The rest of the app
 * (routes, delete flows) talks only to this export — swapping a bucket
 * or moving between S3 and R2 is purely a config change.
 */
export const storage: StorageDriver = selectDriver();

function selectDriver(): StorageDriver {
  switch (env.UPLOADS_DRIVER) {
    case "local":
      return localDriver;
    case "s3":
      return s3Driver;
  }
}

export { localDriver } from "./local.js";
export { s3Driver } from "./s3.js";
export * from "./driver.js";
