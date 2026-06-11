// audio.js -- 80s chiptune soundtrack (C64/SID style) + sound effects, WebAudio
var AudioSys = (function () {
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var musicOn = true, timer = null, step = 0, nextTime = 0;
  var TEMPO = 132, SPB = 60 / TEMPO / 4; // 16th notes
  var noiseBuf = null;

  // A-minor progression: Am | F | C | E  (midi note numbers)
  var CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]];

  function midiFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function tone(dest, type, f0, f1, t, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function hat(t, vol) {
    var src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = noiseBuf;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(g); g.connect(musicGain);
    src.start(t); src.stop(t + 0.05);
  }

  function scheduleStep(s, t) {
    var bar = Math.floor(s / 16), pos = s % 16;
    var chord = CHORDS[bar];
    var lift = (Math.floor(s / 64) % 2) ? 12 : 0; // alternate octave each loop

    // bass (triangle), driving eighths with an octave bounce
    if (pos % 2 === 0) {
      var root = chord[0] - 24 + ((pos % 8 === 4) ? 12 : 0);
      tone(musicGain, 'triangle', midiFreq(root), 0, t, SPB * 1.8, 0.20);
    }
    // SID-style arpeggio (square), every 16th
    var m = chord[(s + Math.floor(s / 3)) % 3] + 12 + lift;
    tone(musicGain, 'square', midiFreq(m), 0, t, SPB * 0.9, 0.055);
    // sparse lead accent on beat starts
    if (pos === 0 || pos === 10) {
      tone(musicGain, 'square', midiFreq(chord[2] + 12 + lift), 0, t, SPB * 3, 0.05);
    }
    // drums
    if (pos % 4 === 2) hat(t, 0.05);
    if (pos === 0 || pos === 8) tone(musicGain, 'sine', 130, 45, t, 0.1, 0.30);
  }

  function scheduler() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
      if (musicOn) scheduleStep(step, nextTime);
      step = (step + 1) % 64;
      nextTime += SPB;
    }
  }

  function unlock() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.55; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(scheduler, 30);
      probeVoices();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function toggleMusic() {
    musicOn = !musicOn;
    return musicOn;
  }

  // ---- voice clips (e.g. Tolkien readings) -------------------------------
  // Drop your own legally obtained clips into audio/voice/ named
  // voice1.mp3 .. voice8.mp3 and they will play occasionally during the
  // descent, with the music ducking underneath them.
  var voiceClips = [], voicePlaying = false, voiceProbed = false;

  function probeVoices() {
    if (voiceProbed) return;
    voiceProbed = true;
    for (var i = 1; i <= 8; i++) {
      (function (n) {
        var a = new Audio('audio/voice/voice' + n + '.mp3');
        a.preload = 'auto';
        a.addEventListener('canplaythrough', function () {
          if (voiceClips.indexOf(a) < 0) voiceClips.push(a);
        });
        a.addEventListener('error', function () { /* clip not present, fine */ });
      })(i);
    }
  }

  // Long files (whole audiobook chapters) work too: a random ~45 second
  // passage is played and faded out, music ducks underneath.
  var EXCERPT = 45;
  function voice() {
    probeVoices();
    if (!voiceClips.length || voicePlaying) return;
    var clip = voiceClips[Math.floor(Math.random() * voiceClips.length)];
    voicePlaying = true;
    if (musicGain) musicGain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.5);
    var dur = isFinite(clip.duration) ? clip.duration : 0;
    clip.currentTime = dur > EXCERPT + 20 ? 10 + Math.random() * (dur - EXCERPT - 20) : 0;
    clip.volume = 0.9;
    var fadeTimer = null, stopTimer = null;
    var done = function () {
      voicePlaying = false;
      clearInterval(fadeTimer); clearTimeout(stopTimer);
      clip.pause();
      if (musicGain) musicGain.gain.setTargetAtTime(0.55, ctx.currentTime, 1.0);
      clip.removeEventListener('ended', done);
    };
    clip.addEventListener('ended', done);
    stopTimer = setTimeout(function () {
      fadeTimer = setInterval(function () { // HTMLAudio has no ramp, fade manually
        clip.volume = Math.max(0, clip.volume - 0.06);
        if (clip.volume <= 0) done();
      }, 150);
    }, EXCERPT * 1000);
    clip.play().catch(function () { done(); });
  }

  function sfx(name) {
    if (!ctx) return;
    var t = ctx.currentTime;
    switch (name) {
      case 'hit':    tone(sfxGain, 'square', 880, 440, t, 0.07, 0.12); break;
      case 'hurt':   tone(sfxGain, 'square', 200, 90, t, 0.13, 0.18); break;
      case 'gold':
        tone(sfxGain, 'triangle', 1320, 0, t, 0.06, 0.15);
        tone(sfxGain, 'triangle', 1760, 0, t + 0.07, 0.08, 0.15);
        break;
      case 'level':
        [60, 64, 67, 72].forEach(function (m, i) {
          tone(sfxGain, 'square', midiFreq(m + 12), 0, t + i * 0.08, 0.1, 0.12);
        });
        break;
      case 'stairs': tone(sfxGain, 'triangle', 440, 200, t, 0.3, 0.15); break;
      case 'potion': tone(sfxGain, 'sine', 600, 1200, t, 0.2, 0.12); break;
      case 'death':  tone(sfxGain, 'square', 440, 50, t, 1.4, 0.25); break;
      case 'win':
        [60, 64, 67, 72, 76, 79].forEach(function (m, i) {
          tone(sfxGain, 'triangle', midiFreq(m + 12), 0, t + i * 0.13, 0.22, 0.18);
        });
        break;
    }
  }

  return { unlock: unlock, toggleMusic: toggleMusic, sfx: sfx, voice: voice };
})();
