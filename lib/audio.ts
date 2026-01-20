
import { SoundEffect } from '../types';

// 存储当前播放的音频对象，用于控制播放
let currentAudio: HTMLAudioElement | null = null;
let loopAudio: HTMLAudioElement | null = null;

export const playSound = (type: SoundEffect, mp3Url?: string): void => {
  try {
    if (type === SoundEffect.MP3 && mp3Url) {
      // 先停止之前正在播放的结果音效（但不停止modal音效）
      if (currentAudio) {
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (e) {
          // 忽略停止时的错误
        }
        currentAudio = null;
      }
      
      // 播放MP3文件
      console.log('🎵 [调试] 播放 MP3 音效，URL:', mp3Url);
      const audio = new Audio(mp3Url);
      audio.volume = 0.7;
      audio.play().then(() => {
        console.log('🎵 [调试] MP3 音效播放成功');
      }).catch(e => {
        // 忽略常见的正常错误
        // AbortError: 当play()被pause()中断时发生（正常）
        // NotAllowedError: 当用户未交互时尝试播放音频时发生（正常）
        // NotSupportedError: 当文件格式不支持或文件找不到时发生（可能是路径问题，但不需要报错）
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && e.name !== 'NotSupportedError') {
          console.error("MP3播放错误:", e);
        } else {
          console.warn('🎵 [调试] MP3 播放被阻止:', e.name);
        }
      });
      currentAudio = audio;
      return;
    }
    
    // 原有的合成音效
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === SoundEffect.SOUND_1) {
      // 科技感開獎音 - 大幅增強音量和持續時間，確保每次都能清楚聽到
      console.log('🎵 [调试] 播放 SOUND_1 音效');
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
        // 大幅增加音量和持續時間，確保每次都能清楚聽到
        g.gain.setValueAtTime(0.5, ctx.currentTime); // 音量從 0.3 增加到 0.5
        g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.8); // 持續時間從 0.5 秒增加到 0.8 秒
        o.start();
        o.stop(ctx.currentTime + 0.8);
        console.log('🎵 [调试] SOUND_1 音效已開始播放，持續時間: 0.8 秒');
      } catch (e) {
        console.error('🎵 [调试] SOUND_1 音效播放失败:', e);
      }
    } else if (type === SoundEffect.SOUND_2) {
      // 傳統叮咚音 - 增強音量和持續時間
      console.log('🎵 [调试] 播放 SOUND_2 音效');
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.connect(g);
      o2.connect(g);
      g.connect(ctx.destination);
      o1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      o2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      g.gain.setValueAtTime(0.3, ctx.currentTime); // 音量從 0.1 增加到 0.3
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.8); // 持續時間從 0.5 秒增加到 0.8 秒
      o1.start(); o2.start();
      o1.stop(ctx.currentTime + 0.8); o2.stop(ctx.currentTime + 0.8);
      console.log('🎵 [调试] SOUND_2 音效已開始播放，持續時間: 0.8 秒');
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

// 停止循环播放（但不停止 modal 音效）
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
  // 注意：不停止 modalAudio，因为它是独立的
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
// 存储预加载的音频对象（用于快速播放）
let preloadedModalAudio: HTMLAudioElement | null = null;

// 预加载 modal 音效
export const preloadModalSound = (mp3Url: string): void => {
  try {
    if (preloadedModalAudio) {
      // 如果已经预加载过，检查是否是同一个文件
      if (preloadedModalAudio.src === mp3Url || preloadedModalAudio.src.endsWith(mp3Url)) {
        console.log('🎵 [调试] 音频已预加载');
        return;
      }
      // 清理旧的预加载音频
      preloadedModalAudio.pause();
      preloadedModalAudio = null;
    }
    
    const audio = new Audio(mp3Url);
    audio.preload = 'auto';
    audio.volume = 1.0;
    audio.loop = true;
    audio.muted = false;
    
    audio.addEventListener('canplaythrough', () => {
      console.log('🎵 [调试] 音频预加载完成');
      preloadedModalAudio = audio;
    }, { once: true });
    
    audio.load();
  } catch (e) {
    console.error('🎵 [调试] 预加载失败:', e);
  }
};

// 播放 modal 音效（用于抽奖 modal 显示时，循环播放直到 modal 消失）
// onAudioStop: 当音频停止时（第6秒）的回调函数
export const playModalSound = (mp3Url: string, preloadedAudio?: HTMLAudioElement | null, onAudioStop?: () => void): HTMLAudioElement | null => {
  try {
    console.log('🎵 [调试] 开始播放 modal 音效:', mp3Url);
    
    // 先停止之前的 modal 音效
    if (modalAudio) {
      console.log('🎵 [调试] 停止之前的 modal 音效');
      modalAudio.pause();
      modalAudio.currentTime = 0;
      modalAudio = null;
    }
    
    // 如果提供了预加载的音频，使用它（可以立即播放）
    let audio: HTMLAudioElement;
    if (preloadedAudio && (preloadedAudio.src === mp3Url || preloadedAudio.src.endsWith(mp3Url))) {
      console.log('🎵 [调试] 使用预加载的音频，可以立即播放');
      // 克隆预加载的音频对象，因为同一个对象不能同时播放多次
      audio = preloadedAudio.cloneNode() as HTMLAudioElement;
      audio.currentTime = 2.0; // 跳过前2秒的静音部分，直接从有声音的地方开始播放
      audio.volume = 1.0;
      audio.loop = false; // 不循环，只播放一次，避免重复播放的感觉
      audio.muted = false;
    } else if (preloadedModalAudio && (preloadedModalAudio.src === mp3Url || preloadedModalAudio.src.endsWith(mp3Url))) {
      console.log('🎵 [调试] 使用全局预加载的音频，可以立即播放');
      audio = preloadedModalAudio.cloneNode() as HTMLAudioElement;
      audio.currentTime = 2.0; // 跳过前2秒的静音部分
      audio.volume = 1.0;
      audio.loop = false; // 不循环，只播放一次，避免重复播放的感觉
      audio.muted = false;
    } else {
      console.log('🎵 [调试] 创建新的音频对象');
      audio = new Audio(mp3Url);
      audio.preload = 'auto';
      // 等待音频加载完成后，跳过前2秒
      audio.addEventListener('loadeddata', () => {
        audio.currentTime = 2.0; // 跳过前2秒的静音部分
      }, { once: true });
    }
    
    audio.volume = 1.0; // 設置為最大音量，確保能聽到
    audio.loop = false; // 不循環播放，只播放一次，避免重複播放的感覺
    audio.muted = false; // 確保不是靜音狀態
    
    // 添加事件监听器用于调试
    audio.addEventListener('loadstart', () => console.log('🎵 [调试] 音频开始加载'));
    audio.addEventListener('loadeddata', () => {
      console.log('🎵 [调试] 音频数据已加载');
      console.log('🎵 [调试] 音频时长:', audio.duration, '秒');
    });
    audio.addEventListener('canplay', () => {
      console.log('🎵 [调试] 音频可以播放');
      console.log('🎵 [调试] 音频时长:', audio.duration, '秒');
    });
    audio.addEventListener('canplaythrough', () => {
      console.log('🎵 [调试] 音频可以完整播放');
      console.log('🎵 [调试] 音频时长:', audio.duration, '秒');
    });
    audio.addEventListener('play', () => {
      console.log('🎵 [调试] 音频开始播放（循环模式）');
      console.log('🎵 [调试] 当前播放时间:', audio.currentTime);
    });
    audio.addEventListener('pause', () => console.log('🎵 [调试] 音频已暂停'));
    audio.addEventListener('ended', () => {
      console.log('🎵 [调试] 音频播放结束');
    });
    audio.addEventListener('timeupdate', () => {
      // 如果播放到第6秒，停止播放并播放音效1
      if (audio.currentTime >= 6.0 && !audio.paused) {
        console.log('🎵 [调试] 音频播放到第6秒，停止播放');
        audio.pause();
        modalAudio = null;
        // 播放音效1
        console.log('🎵 [调试] 准备播放音效1，调用 playSound');
        try {
          playSound(SoundEffect.SOUND_1);
          console.log('🎵 [调试] playSound 调用完成');
        } catch (e) {
          console.error('🎵 [调试] 播放音效1失败:', e);
        }
        // 通知 App.tsx 音频已停止，应该停止转动名字
        if (onAudioStop) {
          console.log('🎵 [调试] 调用 onAudioStop 回调，通知停止转动');
          onAudioStop();
        }
      }
      // 每0.5秒输出一次播放进度（用于调试）
      if (Math.floor(audio.currentTime * 2) % 1 === 0) {
        console.log('🎵 [调试] 播放进度:', audio.currentTime.toFixed(1), '/', audio.duration.toFixed(1), '秒');
      }
    });
    audio.addEventListener('error', (e) => {
      console.error('🎵 [调试] 音频播放错误:', e);
      console.error('🎵 [调试] 错误代码:', audio.error?.code);
      console.error('🎵 [调试] 错误消息:', audio.error?.message);
    });
    
    // 先保存引用，确保能正确停止
    modalAudio = audio;
    console.log('🎵 [调试] 保存 modalAudio 引用:', modalAudio);
    
    // 等待音频加载完成后再播放，确保能立即听到声音
    audio.addEventListener('canplaythrough', () => {
      console.log('🎵 [调试] 音频已完全加载，可以立即播放');
    }, { once: true });
    
    audio.play().then(() => {
      console.log('🎵 [调试] 音频播放成功（循环模式）');
      console.log('🎵 [调试] 音频音量:', audio.volume);
      console.log('🎵 [调试] 音频是否循环:', audio.loop);
      console.log('🎵 [调试] 音频当前时间:', audio.currentTime);
      console.log('🎵 [调试] 音频总时长:', audio.duration);
      console.log('🎵 [调试] 音频是否暂停:', audio.paused);
      console.log('🎵 [调试] 音频是否静音:', audio.muted);
      console.log('🎵 [调试] modalAudio 引用:', modalAudio);
    }).catch(e => {
      console.error('🎵 [调试] 音频播放失败！错误详情:', e);
      console.error('🎵 [调试] 错误名称:', e.name);
      console.error('🎵 [调试] 错误消息:', e.message);
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && e.name !== 'NotSupportedError') {
        console.error('🎵 [调试] Modal音效播放错误:', e);
      } else {
        console.warn('🎵 [调试] 音频播放被阻止（正常情况）:', e.name);
        if (e.name === 'NotAllowedError') {
          console.warn('🎵 [调试] 提示：浏览器需要用户交互才能播放音频，请确保是在点击按钮后播放');
        }
      }
      modalAudio = null; // 播放失败时清空引用
    });
    
    return audio;
  } catch (e) {
    console.error('🎵 [调试] Modal音效播放错误:', e);
    return null;
  }
};

// 停止 modal 音效
export const stopModalSound = () => {
  console.log('🎵 [调试] 尝试停止 modal 音效，modalAudio:', modalAudio);
  if (modalAudio) {
    console.log('🎵 [调试] 停止 modal 音效');
    try {
      console.log('🎵 [调试] 暂停前状态 - paused:', modalAudio.paused, 'currentTime:', modalAudio.currentTime);
      modalAudio.pause();
      modalAudio.currentTime = 0;
      console.log('🎵 [调试] 暂停后状态 - paused:', modalAudio.paused);
    } catch (e) {
      console.warn('🎵 [调试] 停止音效时出错:', e);
    }
    modalAudio = null;
  } else {
    console.log('🎵 [调试] 没有正在播放的 modal 音效（modalAudio 为 null）');
    // 尝试通过查找所有 Audio 元素来停止
    console.log('🎵 [调试] 尝试查找所有 Audio 元素...');
  }
};
