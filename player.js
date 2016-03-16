(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'));
  } else {
    factory(root.jQuery);
  }
}(this, function ($) {

  var AudioPlayer = (function () {
    var noop = function () {
    }

    var defaultOpts = {
      autoplay: false,
      preload: false,
      loop: false,
      onSrcChange: noop,
      onAudioEnd: noop,
      onError: noop,
      onPause: noop,
      onPlaying: noop,
      onPlay: noop,
      playText: 'play',
      pauseText: 'pause',
      selector: {
        played: '#played',
        playButton: '.play-button'
      }
    }

    function AudioPlayer (dom, options) {
      var opts = $.extend({}, defaultOpts, options);

      this.audioInstance = null;
      this.$audioInstance = null;
      this.dom = dom;
      this._src = opts.src;
      this.debug = opts.debug;

      this.autoplay = opts.autoplay;
      this.preload = opts.preload;
      this.controls = opts.controls;
      this.loop = opts.loop;
      this.onSrcChange = opts.onSrcChange;
      this.onAudioEnd = opts.onAudioEnd;
      this.onError = opts.onError;
      this.canplay = false;
      this.onPause = opts.onPause;
      this.onPlaying = opts.onPlaying;
      this.onPlay = opts.onPlay;

      this.playText = opts.playText;
      this.pauseText = opts.pauseText;

      this.selector = opts.selector;

      this._playingButton = null;


      this.state = {
        playedUid: null,
        isPlay: false
      }

      this.lock = {
        play: false,
        pause: false
      }

      this.duration = null;
    }

    return AudioPlayer
  })();

  AudioPlayer.prototype.setMedia = function (src) {
    this._src = src;

    if (this.audioInstance) {
      if (this.audioInstance.src !== '' && this.audioInstance.src !== src) {
        this.$audioInstance.trigger('audioPlayer:srcChange', src);
      }

      this.audioInstance.src = src;
    }
  }

  AudioPlayer.prototype.log = function (flag) {
    var msg = [].slice.call(arguments, 1).join(' ')

    switch (flag) {
      case 'info':
        console.log('%c INFO: ' + msg, 'color: blue');
        break;

      case 'error':
        console.log('%c ERROR: ' + msg, 'color: red');
        break

      default:
        console.log('%c LOG: ' + msg, 'color: black');
    }
  }

  AudioPlayer.prototype.simulateEnded = function (duration) {
    var totalTime = duration * 1000;
    var self = this;

    function tick () {
      totalTime -= 100;

      if (totalTime < 0) {
        self.trigger('audioPlayer:ended');

        if (!self.loop) {
          self.stop();
        }
      }
    }

    var timer = setInterval(tick, 102);

    self.$audioInstance.on('audioPlayer:pause', function () {
      clearTimeout(timer);
    })

    self.$audioInstance.on('audioPlayer:play', function () {
      timer = setInterval(tick, 102);
    })


    // TODO 快进修复
//    self.$audioInstance.on('timeupdate', function (e) {
//      var currentTime = e.target.currentTime;
//    });
  }

  AudioPlayer.prototype.addAttribute = function () {
    var audio = this.audioInstance;

    if (this.controls) {
      audio.setAttribute('controls', '');
    }

    if (this._src) {
      audio.src = this._src;

      if (this.preload) {
        audio.setAttribute('preload', '');
      }
    }
  }

  AudioPlayer.prototype.buildAudio = function () {
    var audio = document.createElement('audio')

    audio.innerHTML = 'Your browser does not support the <code>audio</code> element.'

    audio.id = this.uid;

    this.audioInstance = audio;
    this.$audioInstance = $(audio);

    this.addAttribute();

    $(this.dom).append(audio);
  }

  AudioPlayer.prototype.clearLock = function () {
    var self = this;

    this.$audioInstance.on('play', function () {
      self.lock.play = false;
    });

    this.$audioInstance.on('pause', function () {
      self.lock.pause = false;
    });
  }

  AudioPlayer.prototype._init = function () {

    this.buildAudio();
    this.bindEvent();
    this.bindInterface();
    this.clearLock();

    return this;
  }

  AudioPlayer.prototype.bindInterface = function () {
    var self = this;

    self.$audioInstance.on('audioPlayer:play', function (e, src, button) {
      $(self.selector.playButton).text(self.playText);

      if (!button) {
        if (!self._playingButton) {
          $(self.selector.playButton).eq(0).text(self.pauseText);
          self._playingButton = $(self.selector.playButton).eq(0);
        }
        else {
          $(self._playingButton).text(self.pauseText);
        }
      }
      else {
        $(button).text(self.pauseText);

        self._playingButton = button;
      }
    });

    self.$audioInstance.on('audioPlayer:pause', function (e, src, button) {

      if (!button) {
        $(self._playingButton).text(self.playText);
      }
      else {
        $(button).text(self.playText);
      }

    });
  }

  AudioPlayer.prototype.bindEvent = function () {
    var self = this;

    this.$audioInstance.on('audioPlayer:ended', function (e) {
      if (self.debug) {
        self.log('info', 'sound: ' + e.target.currentSrc + 'ended');
      }

      self._playEnd = true;
      self.onAudioEnd(e);
    });

    this.$audioInstance.on('loadedmetadata', function (e) {
      if (self.debug) {
        self.log('info', 'start loading ' + e.target.currentSrc);
      }

      var duration = e.target.duration;

      // safari will receive Infinity if there is no content-length header from response header
      if (!duration || Math.pow(2, 20) < duration) {
        self.log('error', 'can not receive music duration, ended event will not be fired!!!');
      }
      else {
        self.simulateEnded(duration);
      }
    })

    this.$audioInstance.on('audioPlayer:play', function (e, src) {
      if (self.debug) {
        self.log('info', 'sound start to playing...');
      }

      self.onPlay(e, src);
    });

    this.$audioInstance.on('error', function (e) {
      if (self.debug) {
        self.log('error', 'unexpected error, maybe browser does not support your music format');
      }

      self.onError(e, 'unexpected error, maybe browser does not support your music format');
    })

    this.$audioInstance.on('audioPlayer:srcChange', function (e, src) {
      if (self.debug) {
        self.log('info', 'switch music to ', src);
      }

      self.onSrcChange(e, src)
    });

    this.$audioInstance.on('audioPlayer:pause', function (e, src, button) {
      if (self.debug) {
        self.log('info', 'music paused', src);
      }

      self.onPause(e, src, button)
    })

    this.$audioInstance.on('timeupdate', function (e) {
      if (self.debug) {
        self.log('log', 'current played ' + e.target.currentTime)
      }

      self.onPlaying(e, e.target.currentTime);
    });

    this.$audioInstance.on('play', function (e) {
      if (!self.lock.play) {
        self.lock.play = true;

        self.state.isPlay = true;

        self.$audioInstance.trigger('audioPlayer:play', e.target.currentSrc);
      }
    });

    this.$audioInstance.on('pause', function (e) {

      if (!self.lock.pause) {
        self.lock.pause = true;

        self.state.isPlay = false;

        self.$audioInstance.trigger('audioPlayer:pause', e.target.currentSrc);
      }
    });
  }

  AudioPlayer.prototype.play = function (src, buttonInstance) {

    if (!!src && src !== this._src) {
      this.setMedia(src);
      this.audioInstance.play();

      this.state.isPlay = true;

      if (!this.lock.play) {
        this.lock.play = true;

        this.$audioInstance.trigger('audioPlayer:play', [src, buttonInstance]);
      }
      return this;
    }

    if (this.state.isPlay) {
      this.audioInstance.pause();
      this.state.isPlay = false;

      if (!this.lock.pause) {
        this.lock.pause = true;

        this.$audioInstance.trigger('audioPlayer:pause', [this._src, buttonInstance]);
      }
    }
    else {
      this.audioInstance.play();
      this.state.isPlay = true;

      if (!this.lock.play) {
        this.lock.play = true;

        this.$audioInstance.trigger('audioPlayer:play', [this._src, buttonInstance]);
      }
    }

    this.state.playedUid = this.uid;
  }

  AudioPlayer.prototype.pause = function () {
    this.audioInstance.pause();

    this.state.isPlay = false;
  }

  AudioPlayer.prototype.stop = function () {
    this.audioInstance.pause();
    this.audioInstance.currentTime = 0;

    this.state.isPlay = false;
  }

  $.fn.audioPlayer = function () {
    var opt = arguments[0];

    return new AudioPlayer(this, opt)._init();
  };
}));