# AudioSpectrum-Youtube-Ytplayer-phantombot

Official forum web page:
https://community.phantombot.tv/topic/834/ytplayer-audio-spectrum-visualizer-youtube-audio-spectrum-on-your-stream/

An audio spectrum on your stream !
This script allow you to display the audio spectrum from the current music played by phantombot !
Screen :
# Youtube Audio spectrum from phantombot ytplayer !

Phantombot tested version : 2.2
An audio spectrum on your stream !
This script allow you to display the audio spectrum from the current music played by phantombot !

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

The script support commands like :
```
!ytp volume 100
!ytp pause
etc...
```

### Prerequisities

What things you need to install the script

-OBS 
-[CLR Browser Source Plugin](https://obsproject.com/forum/resources/clr-browser-source-plugin.22/)

### Installing

- Download as ZIP this git repository.
- Go to your phantombot's web folder
- Replace your ytplayer by the one in your zip.

## Running the script:
- Be sure that ytplayer.js is enabled in phantombot.
- Launch OBS.
- On a scene, add a new CRL Browser
- **Url to type in the CRL Browser settings :**
```
http://{panel_user}:{panel_password}@{ipaddress}:{port}/ytplayer
Example: http://panel:panel@localhost:25005/ytplayer
```

## How it works ?
- video audio is downloaded from my server
- The javascript audio api decode the audio
- Then display an audio spectrum

## Based on

* [HTML5_Audio_Visualizer](https://github.com/wayou/HTML5_Audio_Visualizer) - A basic Javascript AudioAPi example


