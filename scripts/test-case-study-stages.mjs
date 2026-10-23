import assert from 'node:assert/strict';
import {
  FDE_STAGE_TYPES,
  createFdeStage,
  getFdeStageLabel,
  getMissingStageTranslationFields,
  mergeLocalizedProcessStages,
  normalizeProcessStages,
  normalizeProcessTranslations,
  safeCaseStudyUrl,
  shouldRenderProcessStage,
} from '../src/utils/caseStudyStages.js';

const empty = normalizeProcessStages([]);
assert.deepEqual(empty, [], 'no stage is required for any case study');
assert.equal(FDE_STAGE_TYPES.length, 7, 'six optional FDE types plus a custom type are available');

for (const type of FDE_STAGE_TYPES) {
  assert.ok(getFdeStageLabel(type, 'en'), `English label exists for ${type}`);
  assert.ok(getFdeStageLabel(type, 'fr'), `French label exists for ${type}`);
  assert.ok(getFdeStageLabel(type, 'ar'), `Arabic label exists for ${type}`);
}

const first = createFdeStage('problem-context', 0, 'stage-problem-a');
const second = createFdeStage('validation-iteration', 1, 'stage-validation-b');
first.desc = 'Documented source description.';
second.desc = 'A separate source description.';
second.evidence = 'Existing public test reference';
second.technologies = ['React'];
second.media = [{ id: 'media-1', url: 'https://example.test/validation.png', alt: 'Test image' }];
second.links = [{ id: 'link-1', label: 'Public test report', url: 'https://example.test/report' }];
second.is_visible = false;

const normalized = normalizeProcessStages([first, second]);
assert.equal(normalized[0].id, first.id);
assert.equal(normalized[1].is_visible, false);
assert.deepEqual(normalized[1].technologies, ['React']);
assert.equal(shouldRenderProcessStage(normalized[1]), false, 'hidden stages stay out of public rendering');
assert.equal(shouldRenderProcessStage({ ...normalized[1], is_visible: true }), true, 'authored optional content can render');
assert.equal(shouldRenderProcessStage(createFdeStage('outcome-learnings', 2, 'empty-stage')), false, 'an empty stage is not rendered');

const source = [
  { id: 'stage-a', stageType: 'problem-context', step: '01', title: 'Context', desc: 'English context.' },
  { id: 'stage-b', stageType: 'discovery-investigation', step: '02', title: 'Research', desc: 'English discovery.' },
];
const legacyTranslations = {
  fr: { caseStudy: { contribution: { process: [{ title: 'Contexte', desc: 'Contexte français.' }, { title: 'Découverte', desc: 'Description française.' }] } } },
  ar: { caseStudy: { contribution: { process: [{ title: 'السياق', desc: 'وصف السياق.' }, { title: 'الاكتشاف', desc: 'وصف الاكتشاف.' }] } } },
};
const normalizedTranslations = normalizeProcessTranslations(legacyTranslations, source);
assert.equal(normalizedTranslations.fr.caseStudy.contribution.process[0].id, 'stage-a');

// Reorder the source after legacy locale arrays have been upgraded: text follows its stable ID.
const reordered = [source[1], source[0]];
const frRendered = mergeLocalizedProcessStages(reordered, normalizedTranslations.fr.caseStudy.contribution.process);
const arRendered = mergeLocalizedProcessStages(reordered, normalizedTranslations.ar.caseStudy.contribution.process);
assert.deepEqual(frRendered.map((stage) => stage.title), ['Découverte', 'Contexte']);
assert.deepEqual(arRendered.map((stage) => stage.title), ['الاكتشاف', 'السياق']);
assert.deepEqual(mergeLocalizedProcessStages(source, []).map((stage) => stage.desc), ['English context.', 'English discovery.']);

const incomplete = getMissingStageTranslationFields(source[0], { title: 'Contexte' });
assert.deepEqual(incomplete, ['description'], 'the editor can identify only the missing localized source fields');
assert.deepEqual(getMissingStageTranslationFields(source[0], { title: 'Contexte', desc: 'Contexte français.' }), []);

assert.equal(safeCaseStudyUrl('https://example.test/a'), 'https://example.test/a');
assert.equal(safeCaseStudyUrl('/media/a.png'), '/media/a.png');
assert.equal(safeCaseStudyUrl('javascript:alert(1)'), '');
assert.equal(safeCaseStudyUrl('//example.test/a'), '');

console.log('Case-study stage tests passed: optional stages, EN/FR/AR, stable-ID reorder, visibility, and safe URLs.');
