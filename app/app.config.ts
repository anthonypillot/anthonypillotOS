export default defineAppConfig({
  ui: {
    colors: {
      primary: "indigo",
      neutral: "gray",
    },
    checkbox: {
      variants: {
        disabled: {
          true: { root: "opacity-100", container: "opacity-60" },
        },
      },
    },
  },
});
