import content from '@/data/calculator-content.json';

export type ToolkitEditorial = {
  description: string; seoTitle: string; quickAnswer: string; reviewedAt: string;
  sections: {title: string; paragraphs: string[]}[];
  faqs: {question: string; answer: string}[];
};
export function getToolkitEditorial(slug: string): ToolkitEditorial | undefined {
  const entry = (content as Record<string, Partial<ToolkitEditorial>>)[slug];
  return entry?.quickAnswer ? entry as ToolkitEditorial : undefined;
}
