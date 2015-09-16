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
      this.playSong({
        artist: 'KC & The Sunshine Band',
        title: 'Give It Up',
        cover: 'https://i.scdn.co/image/607129929c0453783bbd6ec805c8bdcba9e06c67',
        youtubeId: 'IeqtAB1WgEw'
      });
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
    var songs = [
       {
        artist: 'Rameses B',
        title: 'Bae Bae',
        cover: 'https://i.scdn.co/image/38c6806e5f7b51545ddb81661b2b0cbe5e2ca333',
        youtubeId: 'prd6fFFMjEk'
       },
       {
        artist: 'Cash Cash',
        title: 'Surrender',
        cover: 'https://i.scdn.co/image/7901b61aff1d23c5f2719b74c1e9a68c40dd54f8',
        youtubeId: 'xAIoh9rxRi8'
       },
       {
        artist: 'Lost Frequencies',
        title: 'Reality',
        cover: 'https://i.scdn.co/image/d8b93f82731d81f65b8bd0a89730ecc5fb584e19',
        youtubeId: 'ilw-qmqZ5zY'
       }
    ];
    this.songs = songs;
  },
  methods: {
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
    stringSnip: function(q) {
      // If the string contains [ or ( then remove them.
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
      q = q.replace(/^"(.+(?="$))"$/, '$1');
      return q;
    },
    getSpotifyMetaData: function(songTitle, songArtist) {
      var spotifySearchQuery = this.stringSnip(songTitle) + '+' + this.stringSnip(songArtist);
      var spotifyApi = 'https://api.spotify.com/v1/search?q=' + spotifySearchQuery + '&type=track';

      //console.debug('Searching Spotify Web API for "' + spotifySearchQuery + '"');

      this.$http.get(spotifyApi, function(data) {
        if (data.tracks.total > 0) {
          var song = data.tracks.items[0];
          //console.debug(song);
          //this.song.title = song.name;
          //this.song.artist = song.artists[0].name;
          this.song.cover = song.album.images[0].url;
        } else {
           this.song.cover = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }

        this.songs.push(this.song);

        // Reset song variable
        this.song = {
          artist: '',
          title: '',
          cover: '',
          youtubeId: ''
        };
      }).error(function(data, status, request) {
        console.error(data);
        console.error(status);
        console.error(request);
      });
    },
    addSong: function(event) {
      event.preventDefault();

      if (this.youtubeUrl) {
        var youtubeId = this.youtubeUrl.split('?v=')[1];
       // var apiKey = 'AIzaSyDkcnW3k8jX423bTAyRMHuIBrOOogwSaZA'; // Live
        var apiKey = 'AIzaSyA92ylDiDyvyHX_RczMaydPAdu69aHOk5I'; // Localhost
        var youtubeApi = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + youtubeId + '&key=' + apiKey;
        var songMeta;

        this.$http.get(youtubeApi, function(data) {
          var youtubeTitle = data.items[0].snippet.title;
          songMeta = this.youtubeTitleToSongMeta(youtubeTitle);

          this.song.title = this.stringSnip(songMeta.title);
          this.song.artist = songMeta.artist;
          this.song.youtubeId = youtubeId;

          this.getSpotifyMetaData(songMeta.title, songMeta.artist);
        }).error(function(data, status, request) {
          console.error(data);
          console.error(status);
          console.error(request);
        });
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