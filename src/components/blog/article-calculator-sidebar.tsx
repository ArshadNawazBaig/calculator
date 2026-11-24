'use client';

import {useEffect, useRef, type ReactNode} from 'react';
import styles from './blog.module.css';

export function ArticleCalculatorSidebar({heading, children}: {heading: string; children: ReactNode}) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    let excessHeight = 0;
    let revealed = 0;
    let lastScroll = window.scrollY;

    // When the list is taller than the window, scrolling the page back up
    // brings the earlier cards back into view before the sidebar pins again.
    const followPage = () => {
      const current = window.scrollY;
      const next = Math.max(0, Math.min(excessHeight, revealed + lastScroll - current));
      lastScroll = current;
      if (next === revealed) return;
      revealed = next;
      sidebar.style.setProperty('--sidebar-reveal', `${revealed}px`);
    };
    const measure = () => {
      const style = getComputedStyle(sidebar);
      excessHeight = style.position === 'sticky'
        ? Math.max(0, sidebar.getBoundingClientRect().height - parseFloat(style.minHeight))
        : 0;
      lastScroll = window.scrollY;
      followPage();
      if (excessHeight > 0) window.addEventListener('scroll', followPage, {passive: true});
      else window.removeEventListener('scroll', followPage);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sidebar);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', followPage);
      sidebar.style.removeProperty('--sidebar-reveal');
    };
  }, []);

  return <aside ref={sidebarRef} className={`related-tools ${styles.articleSidebar}`} aria-labelledby="article-calculators-heading">
    <span className="eyebrow">Keep exploring</span>
    <h2 id="article-calculators-heading">{heading}</h2>
    <div className="related-card-grid">{children}</div>
  </aside>;
}
