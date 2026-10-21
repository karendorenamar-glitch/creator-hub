/**
 * Feature flag for the e-invitation module.
 *
 * LOCKED BY DEFAULT: the invitation builder and the public /i/[slug] pages are
 * not ready for customers yet, so nothing can reach them. Enable it only in a
 * development environment by setting NEXT_PUBLIC_ENABLE_E_INVITATION=true.
 */
export const E_INVITATION_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_E_INVITATION === "true";
