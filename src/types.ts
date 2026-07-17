export interface NewsItem {
  id: string;
  country: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface MIReport {
  id: string;
  title: string;
  content: string;
  country: string;
  createdAt: string;
  sections: {
    title: string;
    content: string;
  }[];
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  summary?: string;
}

export interface AppState {
  news: NewsItem[];
  reports: MIReport[];
  files: FileMetadata[];
}
