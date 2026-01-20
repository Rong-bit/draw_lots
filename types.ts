
export enum DrawMethod {
  STEP_BY_STEP = 'STEP_BY_STEP',
  ALL_AT_ONCE = 'ALL_AT_ONCE',
  REVERSE = 'REVERSE'
}

export enum ResultDisplay {
  IN_PAGE = 'IN_PAGE',
  POPUP = 'POPUP'
}

export enum SoundEffect {
  NONE = 'NONE',
  SOUND_1 = 'SOUND_1',
  SOUND_2 = 'SOUND_2',
  MP3 = 'MP3'
}

export interface Prize {
  id: string;
  name: string;
  count: number;
}

export interface Participant {
  id: string;
  name: string;
  raw: string;
}

export interface DrawSettings {
  method: DrawMethod;
  noDuplicate: boolean;
  removeFromList: boolean;
  allowMultiplePrizes: boolean;
  weightedProbability: boolean;
  displayMode: ResultDisplay;
  showSerialNumber: boolean;
  verticalResult: boolean;
  soundEffect: SoundEffect;
  mp3SoundUrl?: string; // MP3音效文件的URL（blob URL）
  showConfetti: boolean;
  fastMode: boolean;
}

export interface DrawWinner {
  prizeName: string;
  winner: Participant;
  serialNumber?: number;
  removed?: boolean; // 是否已移除（不在现场）
}
