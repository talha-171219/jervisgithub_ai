import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  createLocalAudioTrack,
} from 'https://unpkg.com/livekit-client@latest/dist/index.mjs';

const LIVEKIT_URL = "wss://jarvis-ai-agent.onrender.com"; // Replace with your Render deployed LiveKit URL
const TOKEN_ENDPOINT = "/token"; // Endpoint on your backend to get a LiveKit token

let room;
let audioContext;
let audioQueue = [];
let isPlaying = false;
let currentSpeaker = null;

$(document).ready(function () {
  // Initialize SiriWave
  var siriWave = new SiriWave({
    container: document.getElementById("siri-container"),
    width: 940,
    style: "ios9",
    amplitude: "1",
    speed: "0.30",
    height: 200,
    autostart: true,
    waveColor: "#ff0000",
    waveOffset: 0,
    rippleEffect: true,
    rippleColor: "#ffffff",
  });

  // Textillate for initial messages
  $(".text").textillate({
    loop: true,
    speed: 1500,
    sync: true,
    in: {
      effect: "bounceIn",
    },
    out: {
      effect: "bounceOut",
    },
  });

  $(".siri-message").textillate({
    loop: true,
    sync: true,
    in: {
      effect: "fadeInUp",
      sync: true,
    },
    out: {
      effect: "fadeOutUp",
      sync: true,
    },
  });

  // UI functions (adapted from controller.js)
  function DisplayMessage(message) {
    $("#WishMessage").text(message);
    $("#WishMessage").textillate("start");
  }

  function ShowHood() {
    $("#Oval").attr("hidden", false);
    $("#SiriWave").attr("hidden", true);
  }

  function senderText(message) {
    var chatBox = document.getElementById("chat-canvas-body");
    if (chatBox && message.trim() !== "") {
      chatBox.innerHTML += `<div class="row justify-content-end mb-4">
          <div class = "width-size">
          <div class="sender_message">${message}</div>
      </div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function receiverText(message) {
    var chatBox = document.getElementById("chat-canvas-body");
    if (chatBox && message.trim() !== "") {
      chatBox.innerHTML += `<div class=\"row justify-content-start mb-4\">
          <div class = \"width-size\">
          <div class=\"receiver_message\">${message}</div>
          </div>
      </div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function hideLoader() {
    $("#Loader").attr("hidden", true);
    $("#FaceAuth").attr("hidden", false);
  }

  function hideFaceAuth() {
    $("#FaceAuth").attr("hidden", true);
    $("#FaceAuthSuccess").attr("hidden", false);
  }

  function hideFaceAuthSuccess() {
    $("#FaceAuthSuccess").attr("hidden", true);
    $("#HelloGreet").attr("hidden", false);
  }

  function hideStart() {
    $("#Start").attr("hidden", true);
    setTimeout(function () {
      $("#Oval").addClass("animate__animated animate__zoomIn");
    }, 1000);
    setTimeout(function () {
      $("#Oval").attr("hidden", false);
    }, 1000);
  }

  // LiveKit Agent Integration
  async function connectToAgent() {
    try {
      // Get a LiveKit token from your backend
      const response = await fetch(TOKEN_ENDPOINT);
      const data = await response.json();
      const token = data.token;

      room = new Room();

      room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
        DisplayMessage("Connected to Jarvis. Say something!");
        hideStart(); // Hide initial loading screen
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room');
        DisplayMessage("Disconnected from Jarvis.");
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (speakers.length > 0) {
          currentSpeaker = speakers[0];
          console.log(`Current speaker: ${currentSpeaker.identity}`);
          // Optionally update UI to show who is speaking
        } else {
          currentSpeaker = null;
          console.log('No active speakers');
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log(`Subscribed to audio track from ${participant.identity}`);
          track.attach(); // Attach audio to the DOM to be played
          // Handle incoming audio data
          track.on(Track.Event.AudioFrame, (audioFrame) => {
            if (!audioContext) {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const buffer = audioContext.createBuffer(
              audioFrame.numChannels,
              audioFrame.samples.length / audioFrame.numChannels,
              audioFrame.sampleRate
            );
            for (let i = 0; i < audioFrame.numChannels; i++) {
              const channel = buffer.getChannelData(i);
              for (let j = 0; j < audioFrame.samples.length / audioFrame.numChannels; j++) {
                channel[j] = audioFrame.samples[j * audioFrame.numChannels + i];
              }
            }
            audioQueue.push(buffer);
            if (!isPlaying) {
              playNextAudio();
            }
          });
        }
      });

      await room.connect(LIVEKIT_URL, token);
      await room.localParticipant.enableCameraAndMicrophone(); // Enable mic for input
      
      // Start sending user audio to the agent
      const localAudioTrack = await createLocalAudioTrack();
      await room.localParticipant.publishTrack(localAudioTrack);

    } catch (error) {
      console.error('Failed to connect to LiveKit agent:', error);
      DisplayMessage("Failed to connect to Jarvis. Please try again later.");
    }
  }

  function playNextAudio() {
    if (audioQueue.length > 0 && !isPlaying) {
      isPlaying = true;
      const buffer = audioQueue.shift();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        isPlaying = false;
        playNextAudio();
      };
      source.start();
    }
  }

  // Event Listeners for UI buttons
  $("#MicBtn").click(function () {
    // Toggle microphone input
    if (room && room.localParticipant.isMicrophoneEnabled) {
      room.localParticipant.disableMicrophone();
      DisplayMessage("Microphone Off");
      $("#MicBtn i").removeClass("bi-mic-fill").addClass("bi-mic");
    } else if (room) {
      room.localParticipant.enableMicrophone();
      DisplayMessage("Microphone On");
      $("#MicBtn i").removeClass("bi-mic").addClass("bi-mic-fill");
    } else {
      connectToAgent(); // Connect if not already connected
    }
  });

  $("#ChatBtn").click(function () {
    let message = $("#chatbox").val();
    if (message.trim() !== "") {
      senderText(message);
      // Send text message to agent (requires agent to support text input)
      // For now, we'll just display it.
      $("#chatbox").val("");
    }
  });

  $("#chatbox").keypress(function (e) {
    if (e.which == 13) { // Enter key
      $("#ChatBtn").click();
    }
  });

  // Initial connection attempt
  connectToAgent();
});

// Particle JS (from original script.js)
window.addEventListener("load", windowLoadHandler, false);
var sphereRad = 140;
var radius_sp = 1;
var Debugger = function () { };
Debugger.log = function (message) {
  try {
    console.log(message);
  }
  catch (exception) {
    return;
  }
}

function windowLoadHandler() {
  canvasApp();
}

function canvasSupport() {
  return Modernizr.canvas;
}

function canvasApp() {
  if (!canvasSupport()) {
    return;
  }

  var theCanvas = document.getElementById("canvasOne");
  var context = theCanvas.getContext("2d");

  var displayWidth;
  var displayHeight;
  var timer;
  var wait;
  var count;
  var numToAddEachFrame;
  var particleList;
  var recycleBin;
  var particleAlpha;
  var r, g, b;
  var fLen;
  var m;
  var projCenterX;
  var projCenterY;
  var zMax;
  var turnAngle;
  var turnSpeed;
  var sphereCenterX, sphereCenterY, sphereCenterZ;
  var particleRad;
  var zeroAlphaDepth;
  var randAccelX, randAccelY, randAccelZ;
  var gravity;
  var rgbString;
  var p;
  var outsideTest;
  var nextParticle;
  var sinAngle;
  var cosAngle;
  var rotX, rotZ;
  var depthAlphaFactor;
  var i;
  var theta, phi;
  var x0, y0, z0;

  init();

  function init() {
    wait = 1;
    count = wait - 1;
    numToAddEachFrame = 8;

    r = 0;
    g = 72;
    b = 255;

    rgbString = "rgba(" + r + "," + g + "," + b + ",";
    particleAlpha = 1;

    displayWidth = theCanvas.width;
    displayHeight = theCanvas.height;

    fLen = 320;

    projCenterX = displayWidth / 2;
    projCenterY = displayHeight / 2;

    zMax = fLen - 2;

    particleList = {};
    recycleBin = {};

    randAccelX = 0.1;
    randAccelY = 0.1;
    randAccelZ = 0.1;

    gravity = -0;

    particleRad = 1.8;

    sphereCenterX = 0;
    sphereCenterY = 0;
    sphereCenterZ = -3 - sphereRad;

    zeroAlphaDepth = -750;

    turnSpeed = 2 * Math.PI / 1200;
    turnAngle = 0;

    timer = setInterval(onTimer, 10 / 24);
  }

  function onTimer() {
    count++;
    if (count >= wait) {
      count = 0;
      for (i = 0; i < numToAddEachFrame; i++) {
        theta = Math.random() * 2 * Math.PI;
        phi = Math.acos(Math.random() * 2 - 1);
        x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
        y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
        z0 = sphereRad * Math.cos(phi);

        var p = addParticle(x0, sphereCenterY + y0, sphereCenterZ + z0, 0.002 * x0, 0.002 * y0, 0.002 * z0);

        p.attack = 50;
        p.hold = 50;
        p.decay = 100;
        p.initValue = 0;
        p.holdValue = particleAlpha;
        p.lastValue = 0;

        p.stuckTime = 90 + Math.random() * 20;

        p.accelX = 0;
        p.accelY = gravity;
        p.accelZ = 0;
      }
    }

    turnAngle = (turnAngle + turnSpeed) % (2 * Math.PI);
    sinAngle = Math.sin(turnAngle);
    cosAngle = Math.cos(turnAngle);

    context.fillStyle = "#000000";
    context.fillRect(0, 0, displayWidth, displayHeight);

    p = particleList.first;
    while (p != null) {
      nextParticle = p.next;

      p.age++;

      if (p.age > p.stuckTime) {
        p.velX += p.accelX + randAccelX * (Math.random() * 2 - 1);
        p.velY += p.accelY + randAccelY * (Math.random() * 2 - 1);
        p.velZ += p.accelZ + randAccelZ * (Math.random() * 2 - 1);

        p.x += p.velX;
        p.y += p.velY;
        p.z += p.velZ;
      }

      rotX = cosAngle * p.x + sinAngle * (p.z - sphereCenterZ);
      rotZ = -sinAngle * p.x + cosAngle * (p.z - sphereCenterZ) + sphereCenterZ;
      m = radius_sp * fLen / (fLen - rotZ);
      p.projX = rotX * m + projCenterX;
      p.projY = p.y * m + projCenterY;

      if (p.age < p.attack + p.hold + p.decay) {
        if (p.age < p.attack) {
          p.alpha = (p.holdValue - p.initValue) / p.attack * p.age + p.initValue;
        }
        else if (p.age < p.attack + p.hold) {
          p.alpha = p.holdValue;
        }
        else if (p.age < p.attack + p.hold + p.decay) {
          p.alpha = (p.lastValue - p.holdValue) / p.decay * (p.age - p.attack - p.hold) + p.holdValue;
        }
      }
      else {
        p.dead = true;
      }

      if ((p.projX > displayWidth) || (p.projX < 0) || (p.projY < 0) || (p.projY > displayHeight) || (rotZ > zMax)) {
        outsideTest = true;
      }
      else {
        outsideTest = false;
      }

      if (outsideTest || p.dead) {
        recycle(p);
      }

      else {
        depthAlphaFactor = (1 - rotZ / zeroAlphaDepth);
        depthAlphaFactor = (depthAlphaFactor > 1) ? 1 : ((depthAlphaFactor < 0) ? 0 : depthAlphaFactor);
        context.fillStyle = rgbString + depthAlphaFactor * p.alpha + ")";

        context.beginPath();
        context.arc(p.projX, p.projY, m * particleRad, 0, 2 * Math.PI, false);
        context.closePath();
        context.fill();
      }

      p = nextParticle;
    }
  }

  function addParticle(x0, y0, z0, vx0, vy0, vz0) {
    var newParticle;
    var color;

    if (recycleBin.first != null) {
      newParticle = recycleBin.first;
      if (newParticle.next != null) {
        recycleBin.first = newParticle.next;
        newParticle.next.prev = null;
      }
      else {
        recycleBin.first = null;
      }
    }
    else {
      newParticle = {};
    }

    if (particleList.first == null) {
      particleList.first = newParticle;
      newParticle.prev = null;
      newParticle.next = null;
    }
    else {
      newParticle.next = particleList.first;
      particleList.first.prev = newParticle;
      particleList.first = newParticle;
      newParticle.prev = null;
    }

    newParticle.x = x0;
    newParticle.y = y0;
    newParticle.z = z0;
    newParticle.velX = vx0;
    newParticle.velY = vy0;
    newParticle.velZ = vz0;
    newParticle.age = 0;
    newParticle.dead = false;
    if (Math.random() < 0.5) {
      newParticle.right = true;
    }
    else {
      newParticle.right = false;
    }
    return newParticle;
  }

  function recycle(p) {
    if (particleList.first == p) {
      if (p.next != null) {
        p.next.prev = null;
        particleList.first = p.next;
      }
      else {
        particleList.first = null;
      }
    }
    else {
      if (p.next == null) {
        p.prev.next = null;
      }
      else {
        p.prev.next = p.next;
        p.next.prev = p.prev;
      }
    }
    if (recycleBin.first == null) {
      recycleBin.first = p;
      p.prev = null;
      p.next = null;
    }
    else {
      p.next = recycleBin.first;
      recycleBin.first.prev = p;
      recycleBin.first = p;
      p.prev = null;
    }
  }
}

$(function () {
  $("#slider-range").slider({
    range: false,
    min: 20,
    max: 500,
    value: 280,
    slide: function (event, ui) {
      console.log(ui.value);
      sphereRad = ui.value;
    }
  });
});

$(function () {
  $("#slider-test").slider({
    range: false,
    min: 1.0,
    max: 2.0,
    value: 1,
    step: 0.01,
    slide: function (event, ui) {
      radius_sp = ui.value;
    }
  });
});
