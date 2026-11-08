import assert from 'node:assert/strict';
import { prioritizeHomepageSections } from '../src/utils/homepageSections.js';

const source = [
  { id: 'contact', section_type: 'home_contact', sort_order: 3, is_visible: true },
  { id: 'work', section_type: 'selected_work', sort_order: 2, is_visible: false },
  { id: 'hero', section_type: 'home_hero', sort_order: 1, is_visible: true },
  { id: 'lab', section_type: 'lab', sort_order: 4, is_visible: false },
];
const result = prioritizeHomepageSections(source);

assert.deepEqual(result.map((section) => section.section_type), [
  'home_hero', 'selected_work', 'home_contact', 'lab',
]);
assert.equal(result[1].is_visible, true, 'Selected Work must be visible on the public homepage');
assert.deepEqual(result.map((section) => section.sort_order), [0, 1, 2, 3]);
assert.equal(source[1].is_visible, false, 'The original CMS snapshot must not be mutated');
assert.equal(source[1].sort_order, 2, 'The original sort order must not be mutated');

const missingWork = prioritizeHomepageSections([
  { id: 'hero', section_type: 'home_hero', sort_order: 0 },
  { id: 'contact', section_type: 'home_contact', sort_order: 1 },
]);
assert.equal(missingWork[1].section_type, 'selected_work', 'A missing Selected Work block must be supplied');
assert.equal(missingWork[1].is_visible, true);

const noHero = prioritizeHomepageSections([
  { id: 'lab', section_type: 'lab', sort_order: 0 },
]);
assert.equal(noHero[0].section_type, 'selected_work', 'Selected Work should lead when no hero exists');

console.log('Homepage priority checks passed.');
