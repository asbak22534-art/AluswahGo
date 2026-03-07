export type Notification = {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  desc: string;
  fullDesc: string;
  time: string;
  unread: boolean;
  image?: string;
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
