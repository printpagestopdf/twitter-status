import { Entities as EntitiesData, MediaEntity as MediaEntityData, Status as StatusData } from 'twitter-d';
import { User } from './user';

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3600;
const DAY_SECONDS = 86400;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const SUPPORTED_MEDIA = ['photo', 'animated_gif'];

export class Status {
  public retweet?: Status;
  private _data: StatusData;
  private _user: User;

  constructor(parent: StatusData) {
    let status = Object.assign({}, parent);
    if (status.retweeted_status) {
      let retweet = status;
      status = Object.assign({}, status.retweeted_status);
      delete retweet.retweeted_status;
      this.retweet = new Status(retweet);
    }
    this._user = new User(status.user);
    this._data = status;
  }

  public get id_str(): string {
    return this._data.id_str;
  }

  public get user(): User {
    return this._user;
  }

  public get url(): string {
    return `https://twitter.com/${this._user.screen_name}/status/${this._data.id_str}`;
  }

  public get mediaType(): string {
    return this.firstMedia ? this.firstMedia.type : 'none';
  }

  public get mediaUrl(): string {
    const media = this.firstMedia;
    if (media && media.video_info && media.video_info.variants) {
      return media.video_info.variants[0].url;
    } else if (media) {
      return media.media_url_https;
    } else {
      return '';
    }
  }

  public get fallbackMediaUrl(): string {
    const media = this.firstMedia;
    if (media) {
      return media.media_url_https;
    } else {
      return '';
    }
  }

  public get firstMedia(): MediaEntityData | undefined {
    if (this._data.extended_entities && this._data.extended_entities.media) {
      return this._data.extended_entities.media.find(media => {
        return SUPPORTED_MEDIA.includes(media.type);
      });
    } else {
      return;
    }
  }
 
  public get text(): string {
    const media = this.firstMedia;
    return media ? this._data.full_text.replace(media.url, '').trim() : this._data.full_text;
  }
  
  public get card(): string {
    return this._data.card ? this._data.card : '<div>ABER HGALLO</div>';
  }

  public get entities(): EntitiesData {
    return this._data.entities;
  }

  public get createdAt(): Date {
    return new Date(Date.parse(this._data.created_at));
  }

  public get relativeCreatedAt(): string {
    return this.relativeDate(this.createdAt);
  }

  public get replyUrl(): string {
    return `https://twitter.com/intent/tweet?in_reply_to=${this._data.id_str}`
  }

  public get retweetUrl(): string {
    return `https://twitter.com/intent/retweet?tweet_id=${this._data.id_str}`
  }

  public get likeUrl(): string {
    return `https://twitter.com/intent/like?tweet_id=${this._data.id_str}`
  }

  private relativeDate(date: Date): string {
    const now = new Date();
    const delta = (now.getTime() - date.getTime()) / 1000;

    if (delta <= 604800) {
      return this.shortForm(delta);
    } else {
      const day = date.getDate();
      const month = MONTHS[date.getMonth()];
      const year = date.getFullYear() == now.getFullYear() ? '' :  ` ${date.getFullYear()}`;
      return `${day} ${month}${year}`;
    }
  }

  private shortForm(delta: number): string {
    if (delta < MINUTE_SECONDS) {
      return `${Math.round(delta)}s`;
    }
    if (delta < HOUR_SECONDS) {
      return `${Math.round(delta / MINUTE_SECONDS)}m`;
    }
    if (delta < DAY_SECONDS) {
      return `${Math.round(delta / HOUR_SECONDS)}h`;
    }
    return `${Math.round(delta / DAY_SECONDS)}d`;
  }
}
