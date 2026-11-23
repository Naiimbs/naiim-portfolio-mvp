import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [editor, winniPage, assestiniPage, resolver] = await Promise.all([
  read('../src/admin/components/cms/CaseStudyContentEditor.jsx'),
  read('../src/pages/custom-case-studies/WinniCaseStudy.jsx'),
  read('../src/pages/custom-case-studies/AssestiniCaseStudy.jsx'),
  read('../src/services/customCaseStudyContent.js'),
]);

const contracts = {
  winni: {
    page: winniPage,
    sections: {
      problem: ['bulletsJson', 'objectCardsJson', 'imageAlt'],
      idea: ['storyTitle', 'storyBody', 'journeyLabel', 'journeyStepsJson', 'diagramCardsJson', 'diagramAlt'],
      challenge: ['context'],
      scanExperience: ['screensJson'],
      privacy: ['finderTitle', 'finderDescription', 'proxyTitle', 'ownerTitle'],
      location: ['rejectedPointsJson', 'approvedPointsJson'],
      physicalProduct: ['productsJson', 'printStandards', 'cutFormats'],
      systemMatrix: ['matrixRowsJson', 'touchpointLabel', 'physicalLabel', 'digitalLabel'],
      visualSystem: ['colorTokensJson', 'iconsJson'],
      motion: ['scanTitle', 'messageTitle', 'returnedTitle'],
      scope: ['rolesJson'],
      outcome: ['stepsJson', 'principleTitle', 'statusDescription'],
    },
  },
  assestini: {
    page: assestiniPage,
    sections: {
      challenge: ['workflowLabelsJson', 'roleValue', 'focusValue'],
      workflow: ['workflowStepsJson', 'estimatorImageAlt', 'wbsImageAlt'],
      estimation: ['highlightsJson', 'outputsJson'],
      commercial: ['stepsJson'],
      intelligence: ['featureTagsJson', 'detailCardsJson', 'principleTitle', 'dashboardImageAlt'],
      mcp: ['mcpNodesJson'],
      building: ['layersJson', 'principleBadgesJson', 'closingImageAlt'],
    },
  },
};

for (const [slug, contract] of Object.entries(contracts)) {
  for (const [sectionId, fields] of Object.entries(contract.sections)) {
    const sectionMarker = `{ id: '${sectionId}'`;
    assert.ok(editor.includes(sectionMarker), `${slug} CMS editor is missing section group ${sectionId}`);
    const groupStart = editor.indexOf(sectionMarker);
    const groupEnd = editor.indexOf('},', groupStart);
    for (const field of fields) {
      assert.ok(editor.slice(groupStart, groupEnd).includes(`'${field}'`), `${slug} CMS editor is missing ${sectionId}.${field}`);
      assert.ok(contract.page.includes(`sectionContent('${sectionId}')`), `${slug} page does not pass content to ${sectionId}`);
    }
  }
}

assert.ok(editor.includes('next.nativeSections ='), 'English native content must be saved in nativeSections');
assert.ok(editor.includes('nativeSections: { ...(next.translations?.[locale]?.nativeSections || {})'), 'FR/AR native content must be saved under locale translations');
assert.ok(resolver.includes('...base, ...localized'), 'Localized native content must override English fallback content');

console.log('Native case-study CMS binding tests passed: 12 WINNI and 7 Assestini sections, editor fields, page wiring, and locale storage.');
