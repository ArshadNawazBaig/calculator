type MarkdownNode = {type: string; value?: string; children?: MarkdownNode[]};
const inlineParents = new Set(['paragraph', 'heading', 'emphasis', 'strong', 'delete', 'link', 'linkReference', 'tableCell']);

/** Preserve rich-editor table line breaks without enabling arbitrary HTML. */
export function remarkArticleBreaks() {
  return (tree: MarkdownNode) => {
    function visit(parent: MarkdownNode) {
      if (!parent.children) return;
      parent.children = parent.children.map(node => {
        if (node.type === 'html' && /^<br\s*\/?>$/i.test((node.value || '').trim())) {
          const lineBreak = {type: 'break'};
          return inlineParents.has(parent.type) ? lineBreak : {type: 'paragraph', children: [lineBreak]};
        }
        visit(node);
        return node;
      });
    }
    visit(tree);
  };
}
