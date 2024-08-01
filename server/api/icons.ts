import fs from "fs";

/**
 * Retrieves an array of SVG icon paths and names.
 * E.g. "some-icon.svg" -> { name: "Some Icon", path: "./svg/icon.svg" }
 * @returns An array of objects containing the name and path of each SVG icon.
 */
export default defineEventHandler((): { name: string; path: string }[] => {
  return fs.readdirSync("public/svg/icons").map((path) => {
    return {
      name: path
        .replace(/-/g, " ")
        .replace(/\.svg$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      path: `./svg/icons/${path}`,
    };
  });
});
