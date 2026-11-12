// Help pages are read on GitHub (repo nosaac/NuanceWiki, branch Wiki) since
// GitBook was cancelled (NIC-996). Page paths are kept stable by the
// help-content owner; if the pages move, change only this file.
const HELP_BASE = "https://github.com/nosaac/NuanceWiki";

export const helpLinks = {
  frontPage: `${HELP_BASE}/tree/Wiki`,
  termsAndConditions: `${HELP_BASE}/blob/Wiki/terms-and-conditions.md`,
  howToTip: `${HELP_BASE}/blob/Wiki/tipping/how-to-tip.md`,
  contentRules: `${HELP_BASE}/blob/Wiki/content-rules.md`,
  writeForAPublication: `${HELP_BASE}/blob/Wiki/publications/how-to-write-for-a-publication.md`,
} as const;
