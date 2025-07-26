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

  const endTitle = `| ${config.public.title}`;
  const title = `${
    customMetadata?.title ? `${customMetadata.title} ${endTitle}` : `The Operating System by ${config.public.author.name} ${endTitle}`
  }`;

  useSeoMeta({
    title,
    ogTitle: title,
    description: customMetadata?.description ?? config.public.description,
    ogDescription: customMetadata?.description ?? config.public.description,
    ogImage: config.public.logo.os.raw,
    ogUrl: config.public.url,
    twitterTitle: config.public.title,
    twitterDescription: customMetadata?.description ?? config.public.description,
    twitterImage: config.public.logo.os.raw,
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
