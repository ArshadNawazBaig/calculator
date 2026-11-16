/** Labels distinguish diagrams whose geometry is shared but measurement symbols differ. */
export function materialIllustrationId({shape, labels = []}: {shape: string; labels?: string[]}) {
  return `material-${shape}-${labels.join('-')}`;
}
