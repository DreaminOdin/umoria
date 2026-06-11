// settings.js -- persistent user settings (localStorage)
var SETTINGS = (function () {
  var DEFAULTS = {
    display: 'crt',      // 'crt' (authentic) | 'sharp' (modern, crisp)
    phosphor: 'amber',   // 'amber' | 'green' | 'white'
    lifeColors: true,    // screen colour changes with each life
    theme: 'dark',       // 'dark' | 'light'
    music: true,
    keys: 'original'     // 'original' (authentic Umoria) | 'roguelike' (hjkl)
  };
  var s = {};
  for (var k in DEFAULTS) s[k] = DEFAULTS[k];
  try {
    if (typeof localStorage !== 'undefined') {
      var raw = localStorage.getItem('umoria_settings');
      if (raw) {
        var o = JSON.parse(raw);
        for (var k2 in DEFAULTS) if (o[k2] !== undefined) s[k2] = o[k2];
      }
    }
  } catch (e) { /* private mode etc. */ }

  s.save = function () {
    try {
      if (typeof localStorage !== 'undefined') {
        var o = {};
        for (var k3 in DEFAULTS) o[k3] = s[k3];
        localStorage.setItem('umoria_settings', JSON.stringify(o));
      }
    } catch (e) { }
  };
  s.onChange = null;
  s.changed = function () {
    s.save();
    if (s.onChange) s.onChange();
  };
  return s;
})();
