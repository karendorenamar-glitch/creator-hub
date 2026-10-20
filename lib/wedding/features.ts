/**
 * Feature flag for the e-invitation module.
 *
 * Locally the variable is unset, so the feature is enabled.
 * On Vercel set NEXT_PUBLIC_ENABLE_E_INVITATION=false to deploy the wedding
 * planner without the invitation builder or the public /i/[slug] pages.
 */
export const E_INVITATION_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_E_INVITATION !== "false";
