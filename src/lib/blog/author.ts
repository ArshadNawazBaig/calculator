type BlogAuthor = {
  name: string;
  jobTitle?: string;
  avatar?: string;
  profilePath?: string;
};

export function blogAuthor(accountName: string): BlogAuthor {
  const key = accountName.trim().toLowerCase();
  if (key === 'finflo administrator' || key === 'erush') {
    return {name: 'Erush', jobTitle: 'CFO', avatar: '/avatars/finflo-blog-writer.png', profilePath: '/about#erush'};
  }
  return {name: accountName};
}
