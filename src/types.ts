export type Notification = {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'news' | 'prestasi' | 'video' | 'karya';
  title: string;
  desc: string;
  fullDesc: string;
  time: string;
  unread: boolean;
  image?: string;
  linkType?: 'news' | 'prestasi' | 'video' | 'karya' | 'url';
  linkData?: any;
  timestamp?: number;
};

export type ThemeConfig = {
  primaryBg: string;
  primaryText: string;
  primaryLightBg: string;
  gradient: string;
  secondaryBg: string;
  badgeBg: string;
  badgeText: string;
  hoverPrimaryLight: string;
};
