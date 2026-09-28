import React from 'react';
import TextBlock from './TextBlock';
import ImageBlock from './ImageBlock';
import GalleryBlock from './GalleryBlock';
import QuoteBlock from './QuoteBlock';
import MetricsBlock from './MetricsBlock';
import ProcessBlock from './ProcessBlock';
import TechStackBlock from './TechStackBlock';
import CTABlock from './CTABlock';
import SpacerBlock from './SpacerBlock';

function UnsupportedBlock({ block }) {
  return (
    <div className="case-block p-3 my-3 bg-light text-muted small rounded border text-center">
      <i className="bi bi-question-circle me-1"></i> Unsupported content block type: <code>{block?.block_type}</code>
    </div>
  );
}

export const blockRegistry = {
  text: TextBlock,
  hero_content: TextBlock,
  challenge_content: TextBlock,
  contribution_content: TextBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  quote: QuoteBlock,
  metrics: MetricsBlock,
  process: ProcessBlock,
  tech_stack: TechStackBlock,
  technology_tags: TechStackBlock,
  cta: CTABlock,
  spacer: SpacerBlock,
};

export function renderBlock(block) {
  if (!block || block.is_visible === false) return null;
  const Component = blockRegistry[block.block_type] || UnsupportedBlock;
  return <Component key={block.id} content={block.content || {}} block={block} />;
}

export {
  TextBlock,
  ImageBlock,
  GalleryBlock,
  QuoteBlock,
  MetricsBlock,
  ProcessBlock,
  TechStackBlock,
  CTABlock,
  SpacerBlock,
  UnsupportedBlock,
};
