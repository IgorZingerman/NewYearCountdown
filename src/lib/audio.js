// Audio announcement system using Web Speech API

let said = {};
let finalCountDown = false;
let oneHourNotice = false;
let thirtyMinuteNotice = false;

// Check if Web Speech API is available
const isSpeechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Speak text using Web Speech API
 */
function speak(text) {
  if (!isSpeechAvailable) {
    console.log('Speech:', text);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
}

/**
 * Play audio file (for final countdown music)
 */
function playAudioFile(url) {
  if (typeof window === 'undefined') return;
  
  try {
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch(error => {
      console.error('Audio playback error:', error);
      // Browser may block autoplay - user interaction required
    });
  } catch (error) {
    console.error('Audio file error:', error);
  }
}

/**
 * Start Apple Music playlist (placeholder - would need Apple Music API)
 */
function startAppleMusic() {
  // Placeholder - in a real implementation, this would use Apple Music API
  console.log('Starting Apple Music playlist...');
}

/**
 * Handle countdown announcements based on time remaining
 */
export function handleCountdownAnnouncements(hours, minutes, seconds) {
  const time = `${hours}:${minutes}:${seconds}`;

  // One hour notice
  if (oneHourNotice === false && hours === 1 && minutes === 0 && seconds === 0) {
    oneHourNotice = true;
    speak('One hour to New Year countdown begins!');
  }

  // 20 minute notice
  if (thirtyMinuteNotice === false && hours === 0 && minutes === 20 && seconds === 0) {
    thirtyMinuteNotice = true;
    speak('20 minutes to New Year countdown begins!');
  }

  // Final countdown (6 minutes) - play music
  if (finalCountDown === false && hours === 0 && minutes === 6 && seconds === 0) {
    finalCountDown = true;
    // Play final countdown music if available
    playAudioFile('/music/TheFinalCountdown.mp3');
  }

  // 30 second notice
  if (!said[time] && hours === 0 && minutes === 0 && seconds === 30) {
    said[time] = time;
    speak(`${seconds} seconds to New Year countdown begins!`);
  }

  // 10-1 second countdown
  if (!said[time] && hours === 0 && minutes === 0 && seconds <= 10 && seconds !== 0) {
    said[time] = time;
    speak(seconds.toString());
  }

  // Happy New Year!
  if (!said[time] && hours === 0 && minutes === 0 && seconds === 0) {
    said[time] = time;
    speak('Happy New Year!');
    setTimeout(startAppleMusic, 1000);
  }
}

/**
 * Reset announcement state (useful for testing or restarting)
 */
export function resetAnnouncements() {
  said = {};
  finalCountDown = false;
  oneHourNotice = false;
  thirtyMinuteNotice = false;
}

export { speak, playAudioFile };
