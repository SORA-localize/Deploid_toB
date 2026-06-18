/**
 * Central environment variable management and validation.
 */

export const env = {
  formspreeFormId: process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID?.trim() || null,
  gaMeasurementId:
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-PLLDR4X5TV',
  clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || 'x4ow976y5y',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isVercelProduction: process.env.VERCEL_ENV === 'production',
};

// Log warning if critical environment variables are missing in production
if (env.isProd && !env.formspreeFormId) {
  console.warn('[env] NEXT_PUBLIC_FORMSPREE_FORM_ID is not defined. Contact form will be disabled.');
}
