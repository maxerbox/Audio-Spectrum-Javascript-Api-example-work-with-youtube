/*
 * newPlayer.js
 * ------------
 * Interface for the YouTube Player for PhantomBot.
 */
 //modified
 var visu;

var DEBUG_MODE = false;

var startPaused = false;
var playerPaused = false;
var playerMuted = false;
var connectedToWS = false;
var showChat = false;
var loadedChat = false;
var volumeSlider = null;
var progressSlider = null;

var url = window.location.host.split(":");
var addr = 'ws://' + url[0] + ':' + getPlayerPort();
var connection = new WebSocket(addr, []);
var currentVolume = 0;


      function checkMp3(id,callback) {

    var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            if(typeof callback != 'undefined') {
            var js = JSON.parse(xmlHttp.responseText);
            if(js.status=='success') {
            callback(js.message);}
            else {
            throw new Exception('invalid video');
            }
            
            }
        }
        xmlHttp.open("GET", "http://62.210.243.90/mp3/download.php?v="+id, true); // true for asynchronous 
        xmlHttp.send(null);
    };

//end
var Visualizer = function() {
    this.file = null; //the current file
    this.fileName = null; //the current file name
    this.audioContext = null;
    this.source = null; //the audio source
    this.gain = null; //audio volume
    this.info = document.getElementById('info').innerHTML; //this used to upgrade the UI information
    this.infoUpdateId = null; //to sotore the setTimeout ID and clear the interval
    this.animationId = null;
    this.status = 0; //flag for sound is playing 1 or stopped 0
    this.forceStop = false;
    this.allCapsReachBottom = false;
    this.volume = 0.1;
    this.paused = false;
    this.pausedTime = 0;
    this.currentBuffer = null;
    this.end = false;
};
Visualizer.prototype = {
    ini: function() {
        this._prepareAPI();
    },
    _prepareAPI: function() {
        //fix browser vender for AudioContext and requestAnimationFrame
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
        try {
            this.audioContext = new AudioContext();
        } catch (e) {
            this._updateInfo('!Your browser does not support AudioContext', false);
            console.log(e);
        }
        onPlayerReady();
    },
    check: function(id) {
        var that = this; 
            
       //modified
       

            
            checkMp3(id,function(url){
            var request = new XMLHttpRequest();

          request.open('GET', url, true);

          request.responseType = 'arraybuffer';


          request.onload = function() {
              that.file = request.response;
              that.fileName = "yt";
              that._start();

              },
        

          request.send();
            });
    //end
    },
        _start: function() {
        //read and decode the file into audio array buffer 
        var that = this,
            file = this.file;
            var audioContext = that.audioContext;
            if (audioContext === null) {
                console.log('null');
                return;
            };
            that._updateInfo('Decoding the audio', true);
            audioContext.decodeAudioData(file, function(buffer) {
                that._updateInfo('Decode succussfully,start the visualizer', true);
                that._visualize(audioContext, buffer);
            }, function(e) {
                that._updateInfo('!Fail to decode the file', false);
                console.log(e);
            });
    },
    stop: function() {
    if(this.source!=null && this.paused != true) {
        console.log('CurrentTime;stop: ' + this.audioContext.currentTime);
        this.pausedTime = this.audioContext.currentTime;
        this.paused = true;
        this.source.stop(this.pausedTime);
    }
    },
    resume: function() {
    if(this.source!=null && this.paused != false && this.currentBuffer!=null) {
        console.log('CurrentTime;resume: ' + this.audioContext.currentTime);
        this._visualize(this.audioContext,this.currentBuffer);
    }
    },
    reset: function() {
    if(this.source!=null) {
    this.source.stop();
    }
    this.gain = null;
    this.source = null;
    //reset paused time and pause
    this.pausedTime = 0;
    this.paused = false;
    this.currentBuffer = null;
    },
    setVolume: function(volume) {
    if(this.source!=null && this.gain!=null)
    this.gain.gain.value = volume/100;
    this.volume = volume/100;
    },
    _visualize: function(audioContext, buffer) {
        this.currentBuffer=buffer;
        var audioBufferSouceNode = audioContext.createBufferSource(),
            analyser = audioContext.createAnalyser(),
            _gain = audioContext.createGain();
            that = this;
        //connect the source to the analyser
        audioBufferSouceNode.connect(analyser);
        //connect the analyser to the gain, for set sound
        this.gain = _gain
        analyser.connect(this.gain);
        //connect the gain to the destination(the speaker), or we won't hear the sound
        this.gain.connect(audioContext.destination);
        //then assign the buffer to the buffer source node
        audioBufferSouceNode.buffer = buffer;
        //set volume for the gain
        this.gain.gain.value = this.volume;
        //set gain to set volume soon
        //play the source
        if (!audioBufferSouceNode.start) {
            audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
            audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOff method
        };
        //stop the previous sound if any
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.source !== null) {
            this.source.stop(0);
        }
        if(this.paused==true) {
         //if it's need to resume
         console.log(this.pausedTime);
         this.paused = false;
         audioBufferSouceNode.start(0,this.pausedTime);
         this.audioContext.currentTime = this.pausedTime;   
        }
        else {
         audioBufferSouceNode.start(0);
         audioContext.currentTime = 0;
        }
        this.status = 1;
        //set source to resume and stop
        this.source = audioBufferSouceNode;
        //reset to 0 current time to pause and stop music at the right time.
        this.audioContext = audioContext;
        audioBufferSouceNode.onended = function(event) {
            that._audioEnd(that,event);
        };
        this._updateInfo('Playing ' + this.fileName, false);
        this.info = 'Playing ' + this.fileName;
        document.getElementById('fileWrapper').style.opacity = 0.2;
        this._drawSpectrum(analyser);
    },
    _drawSpectrum: function(analyser) {
        var that = this,
            canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //width of the meters in the spectrum
            gap = 2, //gap between meters
            capHeight = 2,
            capStyle = '#fff',
            meterNum = 800 / (10 + 2), //count of the meters
            capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame
        ctx = canvas.getContext('2d'),
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(1, '#0f0');
        gradient.addColorStop(0.5, '#ff0');
        gradient.addColorStop(0, '#f00');
        var drawMeter = function() {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            if (that.status === 0) {
                //fix when some sounds end the value still not back to zero
                for (var i = array.length - 1; i >= 0; i--) {
                    array[i] = 0;
                };
                allCapsReachBottom = true;
                for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                    allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
                };
                if (allCapsReachBottom) {
                    cancelAnimationFrame(that.animationId); //since the sound is stoped and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
                    //send WE ARE READY TO THE NEXT MUSIC
                    onPlayerStateChange({data:0});
                    return;
                };
            };
            var step = Math.round(array.length / meterNum); //sample limited data from the total array
            ctx.clearRect(0, 0, cwidth, cheight);
            for (var i = 0; i < meterNum; i++) {
                var value = array[i * step];
                if (capYPositionArray.length < Math.round(meterNum)) {
                    capYPositionArray.push(value);
                };
                ctx.fillStyle = capStyle;
                //draw the cap, with transition effect
                if (value < capYPositionArray[i]) {
                    ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                } else {
                    ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                    capYPositionArray[i] = value;
                };
                ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
                ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
            }
            that.animationId = requestAnimationFrame(drawMeter);
        }
        this.animationId = requestAnimationFrame(drawMeter);
    },
    _audioEnd: function(instance,e) {
        if (this.forceStop) {
            this.forceStop = false;
            this.status = 1;
            return;
        };
        this.status = 0;
        var text = 'HTML5 Audio API showcase | An Audio Viusalizer';
        document.getElementById('fileWrapper').style.opacity = 1;
        document.getElementById('info').innerHTML = text;
        instance.info = text;
    },
    _updateInfo: function(text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if (this.infoUpdateId !== null) {
            clearTimeout(this.infoUpdateId);
        };
        if (processing) {
            //animate dots at the end of the info text
            var animateDot = function() {
                if (i > 3) {
                    i = 0
                };
                infoBar.innerHTML = text + dots.substring(0, i++);
                that.infoUpdateId = setTimeout(animateDot, 250);
            }
            this.infoUpdateId = setTimeout(animateDot, 250);
        };
    }
}



if (window.location.href.indexOf('start_paused') !== -1) {
    startPaused = true;
}


var playerObject;


function debugMsg(message) {
    if (DEBUG_MODE) console.log("YouTubePlayer::" + message);
}

function onPlayerReady(event) {
    debugMsg("onPlayerReady()");

    var jsonObject = {};
    jsonObject["authenticate"] = getAuth();
    connection.send(JSON.stringify(jsonObject));
    debugMsg("onPlayerReady::connection.send(" + JSON.stringify(jsonObject)+")");

    readyEvent();
}

function readyEvent() {
    debugMsg("readyEvent()");
    var jsonObject = {};
    if (startPaused) {
        jsonObject["status"] = { "readypause" : true };
    } else {
        jsonObject["status"] = { "ready" : true };
    }
    connection.send(JSON.stringify(jsonObject));
    debugMsg("readyEvent::connection.send(" + JSON.stringify(jsonObject)+")");
}

function onPlayerStateChange(event) {
    debugMsg("onPlayerStateChange(" + event.data + ")");


    var jsonObject = {};
    jsonObject["status"] = { "state" : event.data };
    connection.send(JSON.stringify(jsonObject));
    debugMsg("onPlayerStateChange::connection.send(" + JSON.stringify(jsonObject)+")");
}

connection.onopen = function(data) {
    debugMsg("connection.onopen()");
    visu= new Visualizer();
    visu.ini()
    connectedToWS = true;
}

connection.onclose = function(data) {
    debugMsg("connection.onclose()");
    newSongAlert('WebSocket has been closed', 'Restart player when bot is restored', 'danger', 0);
    connectedToWS = false;
}

connection.onmessage = function(e) {
    try {
        var messageObject = JSON.parse(e.data);
    } catch (ex) {
        console.log('YouTubePlayer::connection.onmessage: badJson(' + e.data + '): ' + ex.message);
        return;
    }
    debugMsg("connection.onmessage("+ e.data + ")");

    if (messageObject['authresult'] == false) {
        if (!messageObject['authresult']) {
            newSongAlert('WS Auth Failed', 'Reload page, if that fails, restart bot', 'danger', 0);
            return;
        }
        return;
    }

    if (messageObject['command']) {
        if (messageObject['command']['play']) {
            handlePlay(messageObject['command']['play'], messageObject['command']['title'], 
                       messageObject['command']['duration'], messageObject['command']['requester']);
            return;
        }

        if (messageObject['command']['setvolume']) {
            handleSetVolume(parseInt(messageObject['command']['setvolume']));
            return;
        }

        if (messageObject['command'].localeCompare('pause') == 0) {
            handlePause(messageObject['command']);
            return;
        }

        if (messageObject['command'].localeCompare('querysong') == 0) {
         //   handleQuerySong(messageObject['command']);
            return;
        }
    }

    if (messageObject['songlist']) {
       // handleSongList(messageObject);
        return;
    }

    if (messageObject['playlist']) {
      //  handlePlayList(messageObject);
        return;
    }

    debugMsg('YouTubePlayer::connection.onmessage: unknownJson(' + e.data + ')');
}

/*function handlePlayList(d) {
    debugMsg("handlePlayList(" + d + ")");
    $("#playlistTableTitle").html("Current Playlist: " + d['playlistname']);
    var tableData = "<tr><th /><th>Song Title</th><th>Duration</th><th>YouTube ID</th></tr>";
    for (var i in d['playlist']) {
        var id = d['playlist'][i]['song'];
        var title = d['playlist'][i]['title'];
        var duration = d['playlist'][i]['duration'];
        tableData += "<tr>" +
                     "<td width=\"15\"><divclass=\"button\" onclick=\"deletePLSong('" + id + "')\"><i class=\"fa fa-trash-o\" /></div></td>" +
                     "<td>" + title + "</td><td>" + duration + "</td><td>" + id + "</td></tr>";
    }
    $("#playlistTable").html(tableData);
}

function handleSongList(d) {
    debugMsg("handleSongList(" + d + ")");
    var tableData = "<tr><th /><th /><th>Song Title</th><th>Requester</th><th>Duration</th><th>YouTube ID</th></tr>";
    for (var i in d['songlist']) {
        var id = d['songlist'][i]['song'];
        var title = d['songlist'][i]['title'];
        var duration = d['songlist'][i]['duration'];
        var requester = d['songlist'][i]['requester'];
        tableData += "<tr>" +
                     "    <td width=\"15\"><divclass=\"button\" onclick=\"deleteSong('" + id + "')\"><i class=\"fa fa-trash-o\" /></div></td>" +
                     "    <td width=\"15\"><divclass=\"button\" onclick=\"stealSong('" + id + "')\"><i class=\"fa fa-bookmark\" /></div></td>" +
                     "    <td>" + title + "</td>" +
                     "    <td>" + requester + "</td>" +
                     "    <td>" + duration + "</td>" +
                     "<td style=\"{width: 10%; text-align: right}\">"  + id + "</td></tr>";
    }
    $("#songTable").html(tableData);
}*/

function handlePlay(id, title, duration, requester) {
    debugMsg("handlePlay(" + id + ", " + title + ", " + duration + ", " + requester + ")");

    
        visu.reset();
        visu.check(id);


}

function deleteSong(id) {
    debugMsg("deleteSong(" + id + ")");
    var jsonObject = {};
    jsonObject["deletesr"] = id;
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function deletePLSong(id) {
    debugMsg("deletePLSong(" + id + ")");
    var jsonObject = {};
    jsonObject["deletepl"] = id;
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function stealSong(id) {
    debugMsg("stealSong()");
    var jsonObject = {};
    jsonObject["command"] = 'stealsong';
    if (id) {
        jsonObject["youTubeID"] = id;
    }
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function toggleChat() {
    debugMsg("toggleChat()");
    if (showChat) {
        showChat = false;
        $(".chatFrame").hide();
    } else {
        if (!loadedChat) {
            $(".chat").html("<iframe class=\"chatFrame\" src=\"http://www.twitch.tv/" + getChannelName() + "/chat?popout=\">");
            loadedChat = true;
        }
        showChat = true;
        $(".chatFrame").show();
    }
}

function randomizePlaylist(d) {
    debugMsg("randomizePlaylist()");
    var jsonObject = {};
    jsonObject["command"] = "togglerandom";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function skipSong(d) {
    debugMsg("skipSong()");
    var jsonObject = {};
    jsonObject["command"] = "skipsong";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function handlePause(d) {
    debugMsg("handlePause()");
        if(visu.paused==false) {
        visu.stop();
        }
        else {
        visu.resume();
        }
    }



function handleCurrentId(d) {
    debugMsg("handleCurrentId()");
    var jsonObject = {};
    jsonObject["status"] = { "currentid" : playerObject.getVideoUrl().match(/[?&]v=([^&]+)/)[1] };
    connection.send(JSON.stringify(jsonObject));
    debugMsg("handleCurrentId::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function handleSetVolume(d) {
    debugMsg("handleSetVolume(" + d + ")");
    currentVolume = d;
    visu.setVolume(d);
}

function handleCurrentVolume(d) {
    debugMsg("handleCurrentVolume()");
    var jsonObject = {};
    jsonObject["status"] = { "volume" : visu.volume };
    connection.send(JSON.stringify(jsonObject));
    debugMsg("handleCurrentVolume::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function queryPlayList() {
    debugMsg("queryPlayList()");
    var jsonObject = {};
    jsonObject["query"] = "playlist";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("queryPlayList::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function querySongList() {
    debugMsg("querySongList()");
    var jsonObject = {};
    jsonObject["query"] = "songlist";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("querySongList::connection.send(" + JSON.stringify(jsonObject) + ")");
}

// Type is: success (green), info (blue), warning (yellow), danger (red)
function newSongAlert(message, title, type, timeout) {
  debugMsg("newSongAlert(" + message + ", " + title + ", " + type + ", " + timeout + ")");
    console.log(title+':'+message);
}



function playerSeekSong(seekPos) {
   playerObject.seekTo(seekPos, true); 
}

function songRequestDiv() {
    $("#songRequestDiv").html(
        "<div class=\"modal fade\" id=\"songRequestModal\" aria-hidden=\"true\">" +
        "    <div class=\"modal-dialog\">" +
        "        <div class=\"modal-header\">" +
        "            <div class=\"modal-title\" id=\"modalLabel\">YouTube Song Request</div>" +
        "         </div>" +
        "         <div class=\"modal-body\">" +
        "             <form role=\"form\" onkeypress=\"return event.keyCode != 13\">" +
        "                 <div class=\"form-group\">" +
        "                     <label for=\"songRequestInput\">Search String / YouTube Link / YouTube ID</label>" +
        "                     <input type=\"text\" class=\"form-control\" id=\"songRequestInput\" placeholder=\"Song Request\" />" +
        "                 </div>" +
        "             </form>" +
        "         </div>" +
        "         <div class=\"modal-footer\">" +
        "             <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" onclick=\"getFormSongRequest()\">Submit</button>" +
        "             <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button>" +
        "         </div>" +
        "     </div>" +
        "</div>");

    // Reset the data form.
    $("#songRequestDiv").on("hidden.bs.modal", function() {
        $("#songRequestInput").val("");
    });
}
function getFormSongRequest() {
    var jsonObject = {};
    jsonObject["command"] = "songrequest";
    jsonObject["search"] = $("#songRequestInput").val();
    connection.send(JSON.stringify(jsonObject));
}

function sendKeepAlive() {
    var jsonObject = {};
    if (!connectedToWS) {
        return;
    }
    jsonObject["status"] = { "state" : 200 };
    try {
        connection.send(JSON.stringify(jsonObject));
        connectedToWS = true;
    } catch (ex) {
        console.log('YouTubePlayer::sendKeepAlive::exception: ' + ex.message);
    }
}
setInterval(sendKeepAlive, 20000);


