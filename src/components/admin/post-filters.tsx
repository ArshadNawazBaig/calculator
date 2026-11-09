'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dropdown} from '@/components/ui/dropdown';
import {TextField} from '@/components/ui/text-field';
import {BLOG_POST_STATUSES, type BlogPostStatus} from '@/lib/blog/types';
import fieldStyles from '@/components/ui/form-controls.module.css';
import styles from './admin.module.css';

const options = [{value: 'all', label: 'All statuses'}, ...BLOG_POST_STATUSES.map(value => ({value, label: value[0].toUpperCase() + value.slice(1)}))];

export function PostFilters({query, status}: {query: string; status?: BlogPostStatus}) {
  const [selectedStatus, setSelectedStatus] = useState(status || 'all');
  return <form className={styles.filters} method="get" action="/admin/posts">
    <TextField label="Search" name="q" type="search" defaultValue={query} maxLength={200} placeholder="Title or excerpt"/>
    <div className={fieldStyles.root}>
      <label id="post-status-label" htmlFor="post-status" className={fieldStyles.label}>Status</label>
      <Dropdown id="post-status" name="status" value={selectedStatus} onValueChange={setSelectedStatus} options={options} aria-labelledby="post-status-label"/>
    </div>
    <Button variant="secondary" type="submit">Filter posts</Button>
  </form>;
}
