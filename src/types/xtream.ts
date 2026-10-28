/**
 * Xtream Codes API and Android TV data definitions
 */

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  auth: number;
  status: string;
  exp_date?: string;
  is_trial?: string;
  active_cons?: string;
  created_at?: string;
  max_connections?: string;
  allowed_output_formats?: string[];
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  server_protocol: string;
  rtmp_port?: string;
  timezone?: string;
  timestamp_now?: number;
}

export interface XtreamAuthResponse {
  ok?: boolean;
  user_info?: XtreamUserInfo;
  server_info?: XtreamServerInfo;
  status?: string;
  message?: string;
  server_status_code?: number;
}

export interface CategoryItem {
  category_id: string;
  category_name: string;
  parent_id?: number | string;
}

export interface LiveChannel {
  num: number | string;
  name: string;
  stream_type: 'live';
  stream_id: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id?: string;
  category_name?: string;
  current_program?: string;
  next_program?: string;
  stream_url?: string;
  quality?: '4K' | 'FHD' | 'HD' | 'SD';
}

export interface VodMovie {
  stream_id: number | string;
  name: string;
  stream_type: 'movie';
  stream_icon?: string;
  category_id?: string;
  category_name?: string;
  rating?: string | number;
  year?: string | number;
  duration?: string;
  genre?: string;
  plot?: string;
  container_extension?: string;
  stream_url?: string;
  backdrop_url?: string;
}

export interface SeriesEpisode {
  id: string | number;
  episode_num: number;
  title: string;
  container_extension?: string;
  info?: {
    duration?: string;
    plot?: string;
  };
  stream_url?: string;
}

export interface SeriesSeason {
  season_number: number;
  name: string;
  episodes: SeriesEpisode[];
}

export interface SeriesItem {
  series_id: number | string;
  name: string;
  cover?: string;
  category_id?: string;
  category_name?: string;
  rating?: string | number;
  year?: string | number;
  genre?: string;
  plot?: string;
  seasons?: SeriesSeason[];
}

export type ViewTab = 'live' | 'vod' | 'series' | 'epg' | 'favorites' | 'search' | 'settings';
