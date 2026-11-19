/**
 * Short links for the group sign-in page: travelsure.co.il/kupa and travelsure.co.il/kupa/<slug>.
 * /kupa alone opens the main group.
 */
export const GROUP_SLUGS: Record<string, string> = {
  jordan: "default-group-001",
};

export const DEFAULT_GROUP_SLUG = "jordan";

export const groupIdForSlug = (slug?: string) => GROUP_SLUGS[(slug || DEFAULT_GROUP_SLUG).toLowerCase()] || "";

/** The link to share: /kupa/<slug> (several groups can each have their own), else the long form. */
export const shortGroupLink = (groupId: string) => {
  const slug = Object.keys(GROUP_SLUGS).find((s) => GROUP_SLUGS[s] === groupId);
  if (!slug) return `https://travelsure.co.il/bbq/me?g=${encodeURIComponent(groupId)}`;
  return `https://travelsure.co.il/kupa/${slug}`;
};
