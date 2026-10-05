import winniStickerImg from '../assets/images/winni-sticker-real.png';
import assestiniControlCenterImg from '../assets/images/assestini-control-center.png';
import cha9a9aLogoImg from '../assets/images/cha9a9a-logo.png';
import copilotCoverImg from '../assets/images/cover-copilot-naim.png';
import dailyJobsearchCoverImg from '../assets/images/daily-jobsearch-os-cover.png';
import dgaGovHeroImg from '../assets/images/dga_government_services_case_hero_skeleton.png';
import dgaBankingHeroImg from '../assets/images/dga_antifraud_case_hero_skeleton_v2.png';
import dgaDigitalHeroImg from '../assets/images/dga_digital_government_case_hero_skeleton.png';
import dgaRegHeroImg from '../assets/images/dga_regulatory_healthcare_case_hero_skeleton.png';

// Case Study Evidence Images
import cha9a9aReferenceImg from '../assets/images/cha9a9a-homepage-reference.png';
import copilotEvidenceImg from '../assets/images/The-work-behind-the-interface.png';
import dgaGovEvidenceImg from '../assets/images/dga_government_services_case_evidence_skeleton.png';
import dgaBankingEvidenceImg from '../assets/images/dga_antifraud_case_evidence_skeleton_v2.png';
import dgaDigitalEvidenceImg from '../assets/images/dga_digital_government_case_evidence_skeleton.png';
import dgaRegEvidenceImg from '../assets/images/dga_regulatory_healthcare_case_evidence_skeleton.png';

/**
 * Static Asset Dictionary for Portfolio Presentation Assets.
 * Maps asset identifiers, filenames, or project slugs to bundled image assets.
 */
export const ASSET_MAP = {
  // WINNI
  'winni-sticker-real.png': winniStickerImg,
  'winni': winniStickerImg,

  // Assestini
  'assestini-control-center.png': assestiniControlCenterImg,
  'assestini': assestiniControlCenterImg,

  // Cha9a9a
  'cha9a9a-logo.png': cha9a9aLogoImg,
  'cha9a9a': cha9a9aLogoImg,
  'cha9a9a-homepage-reference.png': cha9a9aReferenceImg,

  // Naïm Copilot
  'cover-copilot-naim.png': copilotCoverImg,
  'naim-copilot': copilotCoverImg,
  'The-work-behind-the-interface.png': copilotEvidenceImg,

  // Career OS
  'daily-jobsearch-os-cover.png': dailyJobsearchCoverImg,
  'career-os': dailyJobsearchCoverImg,

  // Saudi Government
  'dga_government_services_case_hero_skeleton.png': dgaGovHeroImg,
  'saudi-government': dgaGovHeroImg,
  'dga_government_services_case_evidence_skeleton.png': dgaGovEvidenceImg,

  // Saudi Banking
  'dga_antifraud_case_hero_skeleton_v2.png': dgaBankingHeroImg,
  'saudi-banking': dgaBankingHeroImg,
  'dga_antifraud_case_evidence_skeleton_v2.png': dgaBankingEvidenceImg,

  // DGA
  'dga_digital_government_case_hero_skeleton.png': dgaDigitalHeroImg,
  'dga': dgaDigitalHeroImg,
  'dga_digital_government_case_evidence_skeleton.png': dgaDigitalEvidenceImg,

  // Saudi Regulatory
  'dga_regulatory_healthcare_case_hero_skeleton.png': dgaRegHeroImg,
  'saudi-regulatory': dgaRegHeroImg,
  'dga_regulatory_healthcare_case_evidence_skeleton.png': dgaRegEvidenceImg,
};

/**
 * Default logo mark mappings by slug (fallback if not specified in Registry metadata)
 */
export const DEFAULT_LOGO_MARKS = {
  'winni': { letter: 'W', className: 'winni' },
  'assestini': { letter: 'A', className: 'assestini' },
  'cha9a9a': { letter: 'C', className: 'cha9a9a' },
  'naim-copilot': { letter: 'N', className: 'copilot' },
  'career-os': { letter: 'C', className: 'copilot' },
  'saudi-government': { letter: 'S', className: 'saudi' },
  'saudi-banking': { letter: 'S', className: 'saudi' },
  'dga': { letter: 'D', className: 'saudi' },
  'saudi-regulatory': { letter: 'S', className: 'saudi' },
};

/**
 * Resolves an asset reference (string key, relative path, or external URL) to a usable image URL.
 */
export function resolveAsset(assetRef) {
  if (!assetRef) return null;
  if (typeof assetRef !== 'string') return assetRef;

  // External URL or root-relative path (e.g. Supabase Storage or public asset)
  if (
    assetRef.startsWith('http://') ||
    assetRef.startsWith('https://') ||
    assetRef.startsWith('data:') ||
    assetRef.startsWith('/assets/')
  ) {
    return assetRef;
  }

  // Strip leading path if someone stored full relative path like "../assets/images/winni-sticker-real.png"
  const cleanKey = assetRef.replace(/^.*[\\/]/, '');

  return ASSET_MAP[assetRef] || ASSET_MAP[cleanKey] || ASSET_MAP[assetRef.toLowerCase()] || assetRef;
}
