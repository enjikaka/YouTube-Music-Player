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

// YoutubePlayer Vue
var youTubePlayerVue = new Vue({
  el: '#youtube-music-player',
  data: {
    youtubePlayer: null,
    canPlay: false,
    currentSong: {
      artist: 'Artist',
      title: 'Title',
      cover: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
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
    playerStateChange: function(event) {
      //console.debug('[YoutubePlayer] State Change:');
      //console.debug(event);
    },
    playSong: function(song) {
      this.$data.currentSong = song;
      //console.debug(song.youtubeId);
      global.youtubePlayer.loadVideoById(song.youtubeId, 5, 'large');
    }
  }
});

// Music List Vue
var youTubeMusicListVue = new Vue({
  el: '#youtube-music-list',
  data: {
    songs: [],
    song: {
      artist: '',
      title: '',
      cover: '',
      youtubeId: ''
    },
    youtubeUrl: ''
  },
  ready: function() {
    var app = this;
    app.addSongFromYouTubeId('NQIkzXMG9gQ')
      .then(function() {
        return app.addSongFromYouTubeId('ZBF3IIbvrWc');
      }).then(function() {
        return app.addSongFromYouTubeId('B7SDDp8e_OQ');
      });
  },
  methods: {
    getYoutubeTitle: function(youtubeId) {
      var http = this.$http;

      return new Promise(function(resolve, reject) {
        // var apiKey = 'AIzaSyDkcnW3k8jX423bTAyRMHuIBrOOogwSaZA'; // Live
        var apiKey = 'AIzaSyA92ylDiDyvyHX_RczMaydPAdu69aHOk5I'; // Localhost

        http.get('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + youtubeId + '&key=' + apiKey, function(data) {
          resolve(data.items[0].snippet.title);
        }).error(function(data, status, request) {
          reject(data);
        });
      });
    },
    addSongFromYouTubeId: function(youtubeId) {
        var app = this;

        return new Promise(function(resolve, reject) {
          app.getYoutubeTitle(youtubeId).then(function(title) {
            var songMeta = app.youtubeTitleToSongMeta(title);

            var song = app.song;

            song.title = app.sanitizeString(songMeta.title);
            song.artist = songMeta.artist;
            song.youtubeId = youtubeId;

            app.spotifyGetArtist(song.artist).then(function(data) {
              song.backdrop = data.images[0].url;

              app.spotifyGetCover(songMeta.title, songMeta.artist).then(function(coverUrl) {
                song.cover = coverUrl;
                app.songs.push(song);

                // Reset song variable
                app.song = {
                  artist: '',
                  title: '',
                  cover: '',
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
          q = q.replace(/ *\([^)]*\) */g, '');
          q = q.replace(/ *\[[^)]*\] */g, '');
          q = q.replace(/[\[\]']+/g, '');
      }
      // If the string contains "ft.", replace with ","
      if (q.indexOf('ft.') !== -1) {
          q = q.replace(/ft./g, ', ');
      }
      // If the string contains "feat", replace with ","
      if (q.indexOf('feat') !== -1) {
          q = q.replace(/feat/g, ', ');
      }

      if (q.indexOf('') !== -1) {
          q = q.replace(/feat/g, ', ');
      }
      q = q.replace('(ft', '');
      q = q.replace('(,', '');
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
      var http = this.$http;
      var spotifySearchQuery = this.sanitizeString(songTitle) + '+' + this.sanitizeString(songArtist);

      return new Promise(function(resolve, reject) {
        http.get('https://api.spotify.com/v1/search?q=' + spotifySearchQuery + '&type=track', function(data) {
          var cover;
          if (data.tracks.total > 0) {
            var song = data.tracks.items[0];
            cover = song.album.images[0].url;
          } else {
            cover = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          }

          resolve(cover);
        }).error(function(data, status, request) {
          reject(data);
        });
      });
    },
    addSong: function(event) {
      event.preventDefault();

      if (this.youtubeUrl) {
        var id = this.youtubeUrl.split('?v=')[1];
        this.addSongFromYouTubeId(id);
      }
    },
    playSong: function(index) {
      youTubePlayerVue.playSong(this.songs[index]);
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
        'onStateChange': youTubePlayerVue.playerStateChange
      }
  });
};