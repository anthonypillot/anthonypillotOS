type CustomMetadata = {
  title?: string;
  description?: string;
  favicon?: {
    href: string;
    type: string;
  };
};

/**
 * Sets up SEO metadata and head attributes for the website.
 *
 * @param customMetadata - Optional custom metadata to override the default values.
 */
export default function (customMetadata?: CustomMetadata) {
  const config = useRuntimeConfig();

  const endTitle = `| ${config.app.website.title}`;
  const title = `${
    customMetadata?.title ? `${customMetadata.title} ${endTitle}` : `The Operating System by ${config.app.website.author.name} ${endTitle}`
  }`;

  useSeoMeta({
    title,
    ogTitle: title,
    description: customMetadata?.description ?? config.app.website.description,
    ogDescription: customMetadata?.description ?? config.app.website.description,
    ogImage: config.app.website.logo.os.raw,
    ogUrl: config.app.website.url,
    twitterTitle: config.app.website.title,
    twitterDescription: customMetadata?.description ?? config.app.website.description,
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
        type: customMetadata?.favicon?.type ?? "image/x-icon",
        href: customMetadata?.favicon?.href ?? "/favicon.ico",
      },
    ],
  });
}
