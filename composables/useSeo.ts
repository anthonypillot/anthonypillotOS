type CustomProperties = {
  title?: string;
  description?: string;
  favicon?: {
    href: string;
    type: string;
  };
};

/**
 * Sets up SEO metadata and head attributes for the operating system.
 *
 * @param custom - Optional custom properties for SEO metadata and head attributes.
 */
export default function (custom?: CustomProperties) {
  const config = useRuntimeConfig();

  const endTitle = `| ${config.app.website.title}`;
  const title = `${
    custom?.title ? `${custom.title} ${endTitle}` : `The Operating System by ${config.app.website.author.name} ${endTitle}`
  }`;

  useSeoMeta({
    title,
    ogTitle: title,
    description: custom?.description ?? config.app.website.description,
    ogDescription: custom?.description ?? config.app.website.description,
    ogImage: config.app.website.logo.os.raw,
    ogUrl: config.app.website.url,
    twitterTitle: config.app.website.title,
    twitterDescription: custom?.description ?? config.app.website.description,
    twitterImage: config.app.website.logo.os.raw,
    twitterCard: "summary",
  });

  useHead({
    htmlAttrs: {
      lang: "en",
    },
    link: [
      {
        key: "favicon",
        rel: "icon",
        type: custom?.favicon?.type ?? "image/x-icon",
        href: custom?.favicon?.href ?? "/favicon.ico",
      },
    ],
  });
}
