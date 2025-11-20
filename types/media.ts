export type Scene = {
  id: string;
  title: string;
  script: string;
  imagePrompt: string;
  imageUrl?: string;
  duration: number;
  audio?: {
    url: string;
    format: 'mp3';
    duration: number;
  };
};

export type Storyboard = {
  id: string;
  title: string;
  scenes: Scene[];
  createdAt: string;
  updatedAt: string;
};

export type SocialNetwork = 'twitter' | 'youtube' | 'tiktok' | 'linkedin';

export type SocialPost = {
  id: string;
  network: SocialNetwork;
  message: string;
  assetUrl?: string;
  scheduledFor?: string;
  status: 'pending' | 'posting' | 'posted' | 'failed';
  error?: string;
};
