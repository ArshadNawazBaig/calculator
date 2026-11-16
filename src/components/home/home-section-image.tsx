import Image from 'next/image';
import {homeSectionImages} from '@/data/home-section-images';
import {translator, type Dictionary} from '@/lib/i18n/config';
import styles from './home.module.css';

type HomeSectionImageProps = {
  image: keyof typeof homeSectionImages;
  messages?: Dictionary;
  className?: string;
  sizes?: string;
};

export function HomeSectionImage({image, messages = {}, className, sizes = '(max-width: 960px) calc(100vw - 36px), (max-width: 1344px) 44vw, 560px'}: HomeSectionImageProps) {
  const asset = homeSectionImages[image];
  const t = translator(messages);
  return <Image className={`${styles.sectionImage}${className ? ` ${className}` : ''}`} src={asset.src} alt={t(asset.alt)} width={asset.width} height={asset.height} sizes={sizes} loading="lazy"/>;
}
