var emptyGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

var Vue = require('vue'),
    vueI18n = require('vue-i18n'),
    vueResource = require('vue-resource');

var locales = {
  en: {
    button: {
      addSong: 'Add song'
    },
    label: {
      youtubeUrl: 'YouTube Link'
    },
    title: {
      addSong: 'Add a song',
      songs: 'Songs'
    }
  },
  sv: {
    button: {
      addSong: 'Lägg till låten'
    },
    label: {
      youtubeUrl: 'YouTube-länk'
    },
    title: {
      addSong: 'Lägg till en låt',
      songs: 'Låtar'
    }
  }
};

Vue.use(vueI18n, {
  lang: 'sv',
  locales: locales
});

Vue.use(vueResource);

// YoutubeControls Vue
var youTubeControllerVue = new Vue({
  el: '#youtube-music-controller',
  data: {
    progress: {
      percent: '100%',
      currentTime: 0,
      duration: 0
    },
    timeUpdate: false,
    playIcon: 'play_arrow'
  },
  methods: {
    togglePlay: function() {
      var yt = global.youtubePlayer;
      if (yt.getPlayerState() === 1) {
        yt.pauseVideo();
      } else {
        yt.playVideo();
      }
    },
    playerStateChange: function(event) {
      var yt = global.youtubePlayer;
      if (event.data === 1) {
        this.$data.timeUpdate = true;
        this.$data.playIcon = 'pause';
        global.youtubeTimeUpdate();
      } else {
        this.$data.timeUpdate = false;
        this.$data.playIcon = 'play_arrow';
      }
    },
    formatTime: function(totalSeconds) {
      var date = new Date(1970,0,1);
      date.setSeconds(totalSeconds);
      return date.toTimeString().replace(/.*(\d{2}:\d{2}).*/, "$1");
    }
  }
});

// YoutubePlayer Vue
var youTubePlayerVue = new Vue({
  el: '#youtube-music-player',
  data: {
    youtubePlayer: null,
    canPlay: false,
    showArtist: false,
    currentSong: {
      artist: {
        name: 'Artist',
        image: emptyGif
      },
      title: 'Title',
      cover: emptyGif,
      youtubeId: 'IeqtAB1WgEw'
    }
  },
  ready: function() {
    //console.debug('[Vue:YouTube Music Player] Ready.');
    this.playerInit();
  },
  methods: {
    playerInit: function() {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";

      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    },
    playerReady: function(event) {
      //console.debug('[Vue:YouTube Music Player] YoutubePlayer is ready.');
      event.target.setVolume(100);
      this.canPlay = true;
    },
    playSong: function(song) {
      this.$data.currentSong = song;
      //console.debug(song.youtubeId);
      global.youtubePlayer.loadVideoById(song.youtubeId, 5, 'large');
    },
    artistDrawerToggle: function() {
      this.$data.showArtist = this.$data.showArtist === true ? false : true;
    },
    artistDrawerState: function() {
      return this.$data.showArtist;
    }
  }
});

// Music List Vue
var youTubeMusicListVue = new Vue({
  el: '#youtube-music-list',
  data: {
    addSongShow: false,
    addSongButton: 'library_add',
    songs: [],
    song: {
      artist: {
        name: '',
        image: emptyGif
      },
      title: '',
      cover: emptyGif,
      youtubeId: ''
    },
    youtubeUrl: ''
  },
  ready: function() {
    var app = this;
    app.addSongFromYouTubeId('ZTidn2dBYbY')
      .then(function() {
        return app.addSongFromYouTubeId('I_izvAbhExY');
      }).then(function() {
        return app.addSongFromYouTubeId('dQw4w9WgXcQ');
      });
  },
  methods: {
    getYoutubeInfo: function(youtubeId) {
      var http = this.$http;

      return new Promise(function(resolve, reject) {
        // var apiKey = 'AIzaSyDkcnW3k8jX423bTAyRMHuIBrOOogwSaZA'; // Live
        var apiKey = 'AIzaSyA92ylDiDyvyHX_RczMaydPAdu69aHOk5I'; // Localhost

        http.get('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + youtubeId + '&key=' + apiKey, function(data) {
          resolve(data.items[0].snippet);
        }).error(function(data, status, request) {
          reject(data);
        });
      });
    },
    addSongFromYouTubeId: function(youtubeId) {
        var app = this;

        return new Promise(function(resolve, reject) {
          app.getYoutubeInfo(youtubeId).then(function(snippet) {
            var title = snippet.title;
            var songMeta = app.youtubeTitleToSongMeta(title);

            var song = app.song;

            song.title = app.sanitizeString(songMeta.title);
            song.artist.name = app.sanitizeString(songMeta.artist);
            song.youtubeId = youtubeId;
            song.artist.image = snippet.thumbnails.high.url;
            song.cover = snippet.thumbnails.high.url;

            app.spotifyGetArtist(song.artist.name).then(function(data) {
              song.artist.image = data.images[0] !== undefined ? data.images[0].url : emptyGif;

              app.spotifyGetCover(songMeta.title, songMeta.artist).then(function(coverUrl) {
                console.log(coverUrl);
                song.cover = coverUrl !== undefined ? coverUrl : song.cover;
                app.songs.push(song);

                // Reset song variable
                app.song = {
                  artist: {
                    name: '',
                    image: emptyGif
                  },
                  title: '',
                  cover: emptyGif,
                  youtubeId: ''
                };

                resolve(true);
              });
            });
          });
        });
    },
    youtubeTitleToSongMeta: function(name) {
      name = name === null ? 'Unkown' : name;
      name = name.replace(/_/g, ' ');
      var artist = artist === null ? 'Unkown' : artist;
      if (name.indexOf(' - ') !== -1) {
          name = name.split(' - ');
          artist = name[0];
          name = name[1];
      }
      name = name.split('.')[0];
      return {
          title: name,
          artist: artist
      };
    },
    sanitizeString: function(q) {
      // If the string contains {,[ or ( then remove them.
      if (q.indexOf('[') !== -1 || q.indexOf('(') !== -1) {
          // Remove text in brackets and the brackets
          q = q.replace(/ *\([^)]*\) */g, '')
              .replace(/ *\[[^)]*\] */g, '')
              .replace(/[\[\]']+/g, '');
      }
      // If the string contains "ft.", replace with ","
      if (q.indexOf('ft.') !== -1) {
         q = q.split('ft.')[0];
      }
      // If the string contains "feat", replace with ","
      if (q.indexOf('feat.') !== -1) {
          q = q.split('feat.')[0];
      }

      if (q.indexOf('') !== -1) {
          q = q.replace(/feat/g, ', ');
      }
      q = q.replace('(ft', '')
            .replace('(,', '')
            .replace('♥', 'Heart');
      return q;
    },
    spotifySearchArtist: function(artistName) {
      var http = this.$http;

      return new Promise(function(resolve, reject) {
        http.get('https://api.spotify.com/v1/search?q=' + artistName + '&type=artist', function(data) {
          resolve(data);
        });
      });
    },
    spotifyGetArtist: function(artistName) {
      var app = this;
      return new Promise(function(resolve, reject) {
        app.spotifySearchArtist(artistName).then(function(data) {
          resolve(data.artists.items[0]);
        });
      });
    },
    spotifyGetCover: function(songTitle, songArtist) {
      var app = this;
      var http = app.$http;
      var spotifySearchQuery = app.sanitizeString(songTitle) + '+' + app.sanitizeString(songArtist);

      return new Promise(function(resolve, reject) {
        http.get('https://api.spotify.com/v1/search?q=' + spotifySearchQuery + '&type=track', function(data) {
          var cover;
          if (data.tracks.total > 0) {
            var song = data.tracks.items[0];
            cover = song.album.images[0].url;
          } else {
            cover = undefined;
          }
          resolve(cover);
        }).error(function(data, status, request) {
          reject(data);
        });
      });
    },
    addSong: function(event) {
      event.preventDefault();

      var app = this;

      if (app.youtubeUrl) {
        var id = app.youtubeUrl.split('?v=')[1];
        app.addSongFromYouTubeId(id);
      }

      app.addSongToggle();
    },
    playSong: function(index) {
      youTubePlayerVue.playSong(this.songs[index]);
    },
    addSongToggle: function() {
      this.$data.addSongShow = this.$data.addSongShow === true ? false : true;
      if (!this.$data.addSongShow) {
        this.$data.addSongButton = 'library_add';
        this.$data.youtubeUrl = null;
        document.querySelector('#youtube-url').blur();

      } else {
        this.$data.addSongButton = 'close';
        this.$data.youtubeUrl = null;
        document.querySelector('#youtube-url').focus();
      }
    },
    addSongState: function() {
      return this.$data.addSongShow;
    }
  }
});

global.onYouTubeIframeAPIReady = function() {
  //console.debug('[Vue:YouTube Music Player] onYouTubeIframeAPIReady.');
  global.youtubePlayer = new YT.Player('youtube', {
      height: '256',
      width: '256',
      events: {
        'onReady': youTubePlayerVue.playerReady,
        'onStateChange': youTubeControllerVue.playerStateChange
      }
  });
};

global.youtubeTimeUpdate = function() {
  var yt = global.youtubePlayer,
      currentTime = yt.getCurrentTime(),
      duration = yt.getDuration();
  var percent = (currentTime / duration) * 100;

  youTubeControllerVue.$data.progress.percent = percent + '%';
  youTubeControllerVue.$data.progress.currentTime = youTubeControllerVue.formatTime(currentTime);
  youTubeControllerVue.$data.progress.duration = youTubeControllerVue.formatTime(duration);

  if (youTubeControllerVue.$data.timeUpdate) {
    setTimeout(global.youtubeTimeUpdate, 500);
  }
};