const HOME_HERO_TYPE = 'home_hero';
const SELECTED_WORK_TYPE = 'selected_work';

/**
 * The public homepage always puts Selected Work directly after its hero.
 * Preserve the CMS order for all other blocks, but make the requested portfolio
 * section visible even if an old CMS snapshot marked it hidden or omitted it.
 * Draft previews are intentionally not passed through this function.
 */
export function prioritizeHomepageSections(sections) {
  const sorted = (Array.isArray(sections) ? sections : [])
    .filter(Boolean)
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  const hero = sorted.find((section) => section.section_type === HOME_HERO_TYPE);
  const savedWork = sorted.find((section) => section.section_type === SELECTED_WORK_TYPE);
  const selectedWork = savedWork
    ? { ...savedWork, is_visible: true }
    : {
        id: 'homepage-selected-work-fallback',
        section_type: SELECTED_WORK_TYPE,
        label: 'Home · Selected Work',
        config: {},
        is_visible: true,
      };

  const remaining = sorted.filter(
    (section) => section !== hero && section.section_type !== SELECTED_WORK_TYPE,
  );
  const ordered = [...(hero ? [hero] : []), selectedWork, ...remaining];

  return ordered.map((section, index) => ({ ...section, sort_order: index }));
}
