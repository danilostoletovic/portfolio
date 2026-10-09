/* Keep the established authoring/build order; localization is the final step. */
require('./render-workshop.cjs');
require('./render-testimonials.cjs');
require('./build-pages.cjs');
require('./contact.cjs');
require('./inline-styles.cjs');
require('./build-locales.cjs');
