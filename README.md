# mobile-audio-player
跨平台音频播放器

## 使用方式

```javascript
var player = $('#audioPlayer').audioPlayer({
    controls: true, // 使用默认的控制界面
    loop: false,  // 重播
    debug: false, // 开启debug输出
    src: 'http://localhost:9020/halfbottle.mp3', // 默认的音频播放地址
    onSrcChange: function (e, src) {
      console.log('src change', src);
      $('#player_status').append('<p>src change: ' + src + '</p>');
    },
    onAudioEnd: function (e) {
      console.log('this sound is end!');
      $('#player_status').append('<p>sound is end</p>');
    },
    onPlaying: function (e, second) {
      console.log('current played', second);
      $('#played').html(second.toFixed(2) + 's');
    },
    onPause: function (e, src) {
      console.log('sound paused', src);
      $('#player_status').append('<p>sound pause: ' + src + '</p>');
    },
    onPlay: function (e, src) {
      console.log('sound is going to play!', src);
      $('#player_status').append('<p>sound is going to play: ' + src + '</p>')
    },
    onError: function (e, error) {
      console.log(error);
    },
    selector: {
      played: '#played', // 显示播放进度
      playButton: '.play-button' // 播放按钮选择器
    }
  });

```


## 播放控制

假如目前播放的地址为 `http://localhost:9020/halfbottle.mp3`

player.play('http://localhost:9020/halfbottle.mp3') // 传入相同的地址可以控制播放与暂停


var button = document.querySelector('.play-button');
player.play('http://localhost:9020/halfbottle.mp3', button); // 传入播放按钮的DOM对象就能为该DOM对象修改播放进度