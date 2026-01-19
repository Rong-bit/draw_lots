
import { SoundEffect } from '../types';

// 存储当前播放的音频对象，用于控制播放
let currentAudio: HTMLAudioElement | null = null;
let loopAudio: HTMLAudioElement | null = null;

export const playSound = (type: SoundEffect, mp3Url?: string): void => {
  try {
    if (type === SoundEffect.MP3 && mp3Url) {
      // 播放MP3文件
      const audio = new Audio(mp3Url);
      audio.volume = 0.7;
      audio.play().catch(e => {
        // 忽略常见的正常错误
        // AbortError: 当play()被pause()中断时发生（正常）
        // NotAllowedError: 当用户未交互时尝试播放音频时发生（正常）
        // NotSupportedError: 当文件格式不支持或文件找不到时发生（可能是路径问题，但不需要报错）
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && e.name !== 'NotSupportedError') {
          console.error("MP3播放错误:", e);
        }
      });
      currentAudio = audio;
      return;
    }
    
    // 原有的合成音效
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === SoundEffect.SOUND_1) {
      // 科技感開獎音
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(400, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      o.start();
      o.stop(ctx.currentTime + 0.3);
    } else if (type === SoundEffect.SOUND_2) {
      // 傳統叮咚音
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.connect(g);
      o2.connect(g);
      g.connect(ctx.destination);
      o1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      o2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      o1.start(); o2.start();
      o1.stop(ctx.currentTime + 0.5); o2.stop(ctx.currentTime + 0.5);
    }
    // 如果type是NONE或其他值，不播放任何音效
  } catch (e) {
    console.error("Audio context error:", e);
  }
};

// 循环播放MP3（用于抽奖过程中）
export const playMp3Loop = (mp3Url: string): HTMLAudioElement | null => {
  try {
    // 先停止之前的循环播放
    const previousAudio = loopAudio;
    if (previousAudio) {
      previousAudio.pause();
      previousAudio.currentTime = 0;
      loopAudio = null;
    }
    
    const audio = new Audio(mp3Url);
    audio.loop = true;
    audio.volume = 0.7;
    
    // 处理播放错误，忽略常见的正常错误
    audio.play().catch(e => {
      // 完全忽略这些正常的浏览器行为错误：
      // AbortError: 当play()被pause()中断时发生（正常）
      // NotAllowedError: 当用户未交互时尝试播放音频时发生（正常）
      // NotSupportedError: 当文件格式不支持或文件找不到时发生（可能是路径问题，但不需要报错）
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && e.name !== 'NotSupportedError') {
        console.error("MP3循环播放错误:", e);
      }
      // 静默处理这些错误，不输出任何信息
    });
    
    loopAudio = audio;
    return audio;
  } catch (e) {
    console.error("MP3循环播放错误:", e);
    return null;
  }
};

// 停止循环播放
export const stopMp3Loop = () => {
  if (loopAudio) {
    try {
      loopAudio.pause();
      loopAudio.currentTime = 0;
    } catch (e) {
      // 忽略停止时的错误
    }
    loopAudio = null;
  }
};

// 停止当前播放
export const stopSound = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  stopMp3Loop();
};

// 存储 modal 音效的音频对象
let modalAudio: HTMLAudioElement | null = null;

// 播放 modal 音效（用于抽奖 modal 显示时）
export const playModalSound = (mp3Url: string): HTMLAudioElement | null => {
  try {
    console.log('🎵 [调试] 开始播放 modal 音效:', mp3Url);
    
    // 先停止之前的 modal 音效
    if (modalAudio) {
      console.log('🎵 [调试] 停止之前的 modal 音效');
      modalAudio.pause();
      modalAudio.currentTime = 0;
      modalAudio = null;
    }
    
    const audio = new Audio(mp3Url);
    audio.volume = 0.7;
    
    // 添加事件监听器用于调试
    audio.addEventListener('loadstart', () => console.log('🎵 [调试] 音频开始加载'));
    audio.addEventListener('loadeddata', () => console.log('🎵 [调试] 音频数据已加载'));
    audio.addEventListener('canplay', () => console.log('🎵 [调试] 音频可以播放'));
    audio.addEventListener('play', () => console.log('🎵 [调试] 音频开始播放'));
    audio.addEventListener('pause', () => console.log('🎵 [调试] 音频已暂停'));
    audio.addEventListener('ended', () => console.log('🎵 [调试] 音频播放结束'));
    audio.addEventListener('error', (e) => console.error('🎵 [调试] 音频播放错误:', e));
    
    audio.play().then(() => {
      console.log('🎵 [调试] 音频播放成功');
    }).catch(e => {
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && e.name !== 'NotSupportedError') {
        console.error('🎵 [调试] Modal音效播放错误:', e);
      } else {
        console.warn('🎵 [调试] 音频播放被阻止（正常情况）:', e.name);
      }
    });
    
    modalAudio = audio;
    return audio;
  } catch (e) {
    console.error('🎵 [调试] Modal音效播放错误:', e);
    return null;
  }
};

// 停止 modal 音效
export const stopModalSound = () => {
  if (modalAudio) {
    console.log('🎵 [调试] 停止 modal 音效');
    try {
      modalAudio.pause();
      modalAudio.currentTime = 0;
    } catch (e) {
      console.warn('🎵 [调试] 停止音效时出错:', e);
    }
    modalAudio = null;
  } else {
    console.log('🎵 [调试] 没有正在播放的 modal 音效');
  }
};
