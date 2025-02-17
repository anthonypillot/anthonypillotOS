import { H3Error } from "h3";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("error", async (error, { event }) => {
    if (error instanceof H3Error) {
      if (error.statusCode !== 404 && event) {
        logger.error(`Nuxt error on path [${event.path}], error: ${error}`);
      } else if (error.statusCode !== 404) {
        logger.error(`Nuxt error: ${error}`);
      }
    } else {
      logger.error(`Application error: ${error}`);
    }
  });
});
