(function () {
  var fs = null;
  var path = null;
  var logPath = null;

  try {
    fs = require('fs');
    path = require('path');

    var script = document.currentScript;
    var scriptUrl = script && script.src ? script.src : '';
    var cheatDir = scriptUrl.indexOf('/www/cheat/') !== -1 ? ['www', 'cheat'] : ['cheat'];
    logPath = path.join.apply(path, [process.cwd()].concat(cheatDir, ['rmc-diagnostic.log']));
    fs.writeFileSync(logPath, 'rmc diagnostic start ' + new Date().toISOString() + '\n');
  } catch (error) {
    fs = null;
  }

  function write(message, details) {
    var line = message.indexOf('[RMC]') === 0 ? message : '[RMC] ' + message;

    if (details !== undefined) {
      try {
        line += ' ' + JSON.stringify(details);
      } catch (error) {
        line += ' ' + String(details);
      }
    }

    try {
      console.log(line);
    } catch (error) {
      // Diagnostic only.
    }

    try {
      if (fs && logPath) {
        fs.appendFileSync(logPath, new Date().toISOString() + ' ' + line + '\n');
      }
    } catch (error) {
      // Diagnostic only.
    }
  }

  window.__RMC_DIAGNOSTIC__ = {
    enabled: true,
    path: logPath,
    log: write
  };

  window.addEventListener('error', function (event) {
    write('window error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error && event.error.stack ? event.error.stack : null
    });
  });

  window.addEventListener('unhandledrejection', function (event) {
    write('unhandled rejection', {
      reason: event.reason && event.reason.stack ? event.reason.stack : String(event.reason)
    });
  });

  write('diagnostic loader executing', {
    href: window.location.href,
    logPath: logPath,
    nw: process.versions && process.versions.nw,
    chromium: process.versions && process.versions.chromium
  });

  var cheatScript = document.createElement('script');
  cheatScript.src = 'cheat/cheat.js';
  cheatScript.async = false;
  cheatScript.setAttribute('data-rmc-diagnostic', '1');
  cheatScript.onload = function () {
    write('cheat.js load event');
  };
  cheatScript.onerror = function () {
    write('cheat.js error event');
  };
  document.body.appendChild(cheatScript);

  window.setTimeout(function () {
    var host = document.getElementById('rmc-cheat-host');
    write('host inspect: wrapper after 2s', {
      host: Boolean(host),
      shadow: Boolean(host && host.shadowRoot),
      bodyChildren: document.body.children.length,
      hostStyle: host ? host.getAttribute('style') : ''
    });
  }, 2000);
})();
