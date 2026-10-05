import winniStickerImg from '../assets/images/winni-sticker-real.png';
import assestiniControlCenterImg from '../assets/images/assestini-control-center.png';
import cha9a9aLogoImg from '../assets/images/cha9a9a-logo.png';
import copilotCoverImg from '../assets/images/cover-copilot-naim.png';
import dailyJobsearchCoverImg from '../assets/images/daily-jobsearch-os-cover.png';
import dgaGovHeroImg from '../assets/images/dga_government_services_case_hero_skeleton.png';
import dgaBankingHeroImg from '../assets/images/dga_antifraud_case_hero_skeleton_v2.png';
import dgaDigitalHeroImg from '../assets/images/dga_digital_government_case_hero_skeleton.png';
import dgaRegHeroImg from '../assets/images/dga_regulatory_healthcare_case_hero_skeleton.png';

/**
 * projects.js — PRESENTATION ASSET LOOKUP LAYER ONLY (Phase 6 Architecture).
 *
 * NOTE: The Content Registry (Supabase `content_registry`) is the authoritative source
 * for catalog membership, title, kicker, description, subtitle, tags, badge, sort_order,
 * status, and visibility.
 *
 * This file provides ONLY local asset references (heroImage, heroImageAlt, logoMark)
 * resolved by matching `entry.slug`.
 */
export const projects = [
  {
    id: 'winni',
    slug: 'winni',
    heroImage: winniStickerImg,
    heroImageAlt: 'WINNI QR identification sticker attached to a personal object',
    logoMark: {
      letter: 'W',
      className: 'winni',
    },
    card: {
      logoMark: {
        letter: 'W',
        className: 'winni',
      },
    },
  },
  {
    id: 'assestini',
    slug: 'assestini',
    heroImage: assestiniControlCenterImg,
    heroImageAlt: 'Assestini Business Control Center interface for operational intelligence',
    logoMark: {
      letter: 'A',
      className: 'assestini',
    },
    card: {
      logoMark: {
        letter: 'A',
        className: 'assestini',
      },
    },
  },
  {
    id: 'cha9a9a',
    slug: 'cha9a9a',
    heroImage: cha9a9aLogoImg,
    heroImageAlt: 'Cha9a9a homepage screenshot showing Figma-to-HTML front-end implementation target',
    logoMark: {
      letter: 'C',
      className: 'cha9a9a',
    },
    card: {
      logoMark: {
        letter: 'C',
        className: 'cha9a9a',
      },
    },
  },
  {
    id: 'naim-copilot',
    slug: 'naim-copilot',
    heroImage: copilotCoverImg,
    heroImageAlt: 'Naïm Copilot AI Agent interface and n8n workflow',
    logoMark: {
      letter: 'N',
      className: 'copilot',
    },
    card: {
      logoMark: {
        letter: 'N',
        className: 'copilot',
      },
    },
  },
  {
    id: 'career-os',
    slug: 'career-os',
    heroImage: dailyJobsearchCoverImg,
    heroImageAlt: 'Career OS n8n workflow and job scoring automation',
    logoMark: {
      letter: 'C',
      className: 'copilot',
    },
    card: {
      logoMark: {
        letter: 'C',
        className: 'copilot',
      },
    },
  },
  {
    id: 'saudi-government',
    slug: 'saudi-government',
    heroImage: dgaGovHeroImg,
    heroImageAlt: 'Saudi government digital service interface screenshot',
    logoMark: {
      letter: 'S',
      className: 'saudi',
    },
    card: {
      logoMark: {
        letter: 'S',
        className: 'saudi',
      },
    },
  },
  {
    id: 'saudi-banking',
    slug: 'saudi-banking',
    heroImage: dgaBankingHeroImg,
    heroImageAlt: 'Saudi banking and antifraud interface skeleton',
    logoMark: {
      letter: 'S',
      className: 'saudi',
    },
    card: {
      logoMark: {
        letter: 'S',
        className: 'saudi',
      },
    },
  },
  {
    id: 'dga',
    slug: 'dga',
    heroImage: dgaDigitalHeroImg,
    heroImageAlt: 'DGA digital government experience and design system',
    logoMark: {
      letter: 'D',
      className: 'saudi',
    },
    card: {
      logoMark: {
        letter: 'D',
        className: 'saudi',
      },
    },
  },
  {
    id: 'saudi-regulatory',
    slug: 'saudi-regulatory',
    heroImage: dgaRegHeroImg,
    heroImageAlt: 'Saudi regulatory and healthcare digital service interface',
    logoMark: {
      letter: 'S',
      className: 'saudi',
    },
    card: {
      logoMark: {
        letter: 'S',
        className: 'saudi',
      },
    },
  },
];
