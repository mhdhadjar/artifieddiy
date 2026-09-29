export type AffiliateItem = {
  name: string;
  url: string;
  imageUrl: string;
  note: string;
};

export type ProjectFileCategory = 'tutorial' | 'model3d' | 'printing' | 'other';

export type ProjectFile = {
  id: string;
  category: ProjectFileCategory;
  name: string;
  size: number;
  extension: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Video = {
  id: string;
  youtubeId: string;
  url: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
  tools: AffiliateItem[];
  materials: AffiliateItem[];
  tags: Tag[];
  files: ProjectFile[];
  published: boolean;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: 'user' | 'admin';
};
