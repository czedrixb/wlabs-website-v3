// Tailwind's own plugin entry was dropped in WOS-335 — the blog (its last
// consumer) now renders on src/styles/site.css instead. autoprefixer stays:
// site.css ships some -webkit- prefixes by hand but relies on this for the
// rest.
const config = {
  plugins: {
    autoprefixer: {},
  },
};

export default config;
