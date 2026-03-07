export interface SubForum {
  id: string;
  title: string;
  href: string;
}

export interface Forum {
  id: string;
  title: string;
  href: string;
  description: string;
  subForums: SubForum[];
}

export interface Category {
  title: string;
  forums: Forum[];
}

export interface Thread {
  id: string;
  title: string;
  href: string;
  author: string;
  replies: string;
  views: string;
  lastDate: string;
  isSticky: boolean;
  isPrefix: string;
}

export interface Post {
  id: string;
  author: string;
  avatar: string;
  date: string;
  contentHtml: string;
  reactions: string;
  postNumber: string;
}

export interface Pagination {
  current: number;
  last: number;
}
