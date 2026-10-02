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

export type WeblogBlock = {
  type: 'markdown' | 'image';
  markdown: string;
  imageUrl: string;
  alt: string;
};

export type Weblog = {
  id: string;
  title: string;
  address: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  mainImage: string;
  content: WeblogBlock[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WeblogSummary = {
  address: string;
  title: string;
  description: string;
  mainImage: string;
  updatedAt: string;
};
