let currentSong = new Audio();
let currentSongTrack;
let currentSongIndex;
let currentAlbum;
let songs = [];
let Albums = [
  "Angry_(mood)",
  "Bright_(mood)",
  "Chill_(mood)",
  "Dark_(mood)",
  "Diljit",
  "Funky_(mood)",
  "Love_(mood)",
  "Uplifting_(mood)",
  "cs",
  "karan aujla",
  "ncs"
];
let songName;
let playbarplaybtn = Array.from(document.querySelector(".songButtons").getElementsByClassName("play"))[0];
let playbarprevbtn = Array.from(document.querySelector(".songButtons").getElementsByClassName("prev"))[0];
let playbarnextbtn = Array.from(document.querySelector(".songButtons").getElementsByClassName("next"))[0];

// Fixed GetAlbums: Iterates over explicit list of album folders
async function GetAlbums() {
  document.querySelector(".playlist").innerHTML = "";

  for (const album of Albums) {
    try {
      let a = await fetch(`/assets/songs/${album}/info.json`);
      if (!a.ok) continue;
      let response = await a.json();
      let img = `/assets/songs/${album}/cover.jpg`;
      let title = response.title || album;
      let description = response.description || "";

      document.querySelector(".playlist").innerHTML +=
        `<div class="card cursor" data-folder="${album}">
            <div class="card-img">
              <img class="cover" src="${img}" alt="">
              <img data-album="${album}" class="btn" src="./assets/svg/cardbtn.svg" alt="">
            </div>
            <h2>${title}</h2>
            <p>${description}</p>
         </div>`;
    } catch (err) {
      console.error(`Error loading info.json for ${album}:`, err);
    }
  }
  return Albums;
}

// Fixed getSongs: Uses songs array from info.json instead of scraping folder directory
async function getSongs(album) {
  document.querySelector(".songs>ul").innerHTML = "";
  songs = [];

  try {
    let a = await fetch(`/assets/songs/${album}/info.json`);
    let response = await a.json();
    
    // Ensure songs array exists in info.json, or fallback to response.songs
    songs = response.songs || [];

    let index = 0;
    songs.forEach((song) => {
      document.querySelector(".songs>ul").innerHTML +=
        `<li data-index="${index}" data-album="${album}" data-song="${song}">
            <div class="song">
              <img class="invert cursor" src="./assets/svg/music.svg" alt="" />
              <p>${LoadSongNameText(song)}</p>
            </div>
            <img class="play/pause invert cursor" src="./assets/svg/play.svg" alt="" />
          </li>`;
      index++;
    });
  } catch (err) {
    console.error(`Error loading songs for ${album}:`, err);
  }

  return songs;
}

async function LoadDefaultSongs(album = Albums[0]) {
  currentAlbum = album;
  songs = await getSongs(currentAlbum);

  if (songs.length > 0) {
    LoadSongName(songs[0]);
    currentSong.src = `/assets/songs/${album}/${songs[0]}`;
    currentSongTrack = songs[0];
    currentSongIndex = 0;
  }
}

function LoadSongNameText(track) {
  if (!track) return "";
  return track.replaceAll("%20", " ").replaceAll(".mp3", "");
}

function LoadSongName(track) {
  if (!track) return;
  songName = LoadSongNameText(track);
  let targetSpan = document.querySelector(".songInfo").getElementsByTagName("span")[0];
  if (targetSpan) targetSpan.innerHTML = songName;
}

function playMusic(album, track) {
  if (!track) return;
  LoadSongName(track);

  let targetUrl = `/assets/songs/${album}/${track}`;
  playbarplaybtn.src = "./assets/svg/play.svg";

  let currentDecoded = decodeURIComponent(currentSong.src);

  Array.from(document.querySelectorAll("ul li")).forEach((e) => {
    let playPauseBtn = e.getElementsByClassName("play/pause")[0];
    if (playPauseBtn) playPauseBtn.src = "./assets/svg/play.svg";

    if (e.dataset.song === track) {
      if (currentDecoded.includes(track) || currentSong.src === targetUrl) {
        if (currentSong.paused) {
          currentSong.play();
          if (playPauseBtn) playPauseBtn.src = "./assets/svg/pause.svg";
          playbarplaybtn.src = "./assets/svg/pause.svg";
        } else {
          currentSong.pause();
          if (playPauseBtn) playPauseBtn.src = "./assets/svg/play.svg";
          playbarplaybtn.src = "./assets/svg/play.svg";
        }
      } else {
        currentSong.pause();
        currentSong.src = targetUrl;
        currentSong.play();
        if (playPauseBtn) playPauseBtn.src = "./assets/svg/pause.svg";
        playbarplaybtn.src = "./assets/svg/pause.svg";
      }
    }
  });
}

function PreviousSong(index) {
  if (index > 0) {
    index -= 1;
    currentSongIndex = index;
    Array.from(document.querySelector(".songs ul").getElementsByTagName("li")).forEach((li) => {
      if (li.dataset.index == index) {
        currentSongTrack = li.dataset.song;
        playMusic(currentAlbum, currentSongTrack);
      }
    });
  }
}

function NextSong(index) {
  if (index < songs.length - 1) {
    index += 1;
    currentSongIndex = index;
    Array.from(document.querySelector(".songs ul").getElementsByTagName("li")).forEach((li) => {
      if (li.dataset.index == index) {
        currentSongTrack = li.dataset.song;
        playMusic(currentAlbum, currentSongTrack);
      }
    });
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = Math.floor(seconds % 60);

  let formattedMinutes = String(minutes).padStart(2, "0");
  let formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function main() {
  await GetAlbums();
  await LoadDefaultSongs();

  currentSong.addEventListener("loadedmetadata", () => {
    let Time = formatTime(currentSong.currentTime);
    let Duration = formatTime(currentSong.duration);
    document.querySelector(".songTime").innerHTML = `${Time} / ${Duration}`;
  });

  document.querySelector(".playlist").addEventListener("click", async (e) => {
    let card = e.target.closest(".card");
    if (!card) return;

    if (!currentSong.paused) {
      currentSong.pause();
      playbarplaybtn.src = "./assets/svg/play.svg";
    }

    let btn = e.target.closest(".btn");
    currentAlbum = card.dataset.folder;
    currentSongIndex = 0;
    await LoadDefaultSongs(currentAlbum);

    if (btn && songs.length > 0) {
      await playMusic(currentAlbum, songs[0]);
    }
  });

  document.querySelector(".songs>ul").addEventListener("click", (e) => {
    let li = e.target.closest("li");
    if (!li) return;

    let track = li.dataset.song;
    let index = li.dataset.index;
    songName = track;
    currentSongTrack = track;
    currentSongIndex = parseInt(index);

    let album = li.dataset.album;
    if (track) {
      playMusic(album, track);
    }
  });

  playbarplaybtn.addEventListener("click", () => {
    playMusic(currentAlbum, currentSongTrack);
  });

  playbarprevbtn.addEventListener("click", () => {
    PreviousSong(currentSongIndex);
  });

  playbarnextbtn.addEventListener("click", () => {
    NextSong(currentSongIndex);
  });

  currentSong.addEventListener("timeupdate", () => {
    let Time = formatTime(currentSong.currentTime);
    let Duration = formatTime(currentSong.duration);

    document.querySelector(".songTime").innerHTML = `${Time} / ${Duration}`;
    document.querySelector(".thumb").style.left = ((currentSong.currentTime / currentSong.duration) * 100) + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let rect = e.currentTarget.getBoundingClientRect();
    let click = e.clientX - rect.left;
    let per = Math.floor((click / rect.width) * 100) + 1;
    document.getElementsByClassName("thumb")[0].style.left = per + "%";

    currentSong.currentTime = (currentSong.duration * per) / 100;
  });

  let VolumeCont = document.querySelector(".volume");
  let VolImg = VolumeCont.getElementsByTagName("img")[0];
  let VolumeRange = VolumeCont.querySelector(".volume-range");
  let hideTimeout;

  VolumeRange.addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
    if (currentSong.volume > 0) {
      VolImg.src = "./assets/svg/volume.svg";
    } else {
      VolImg.src = "./assets/svg/mute.svg";
    }
  });

  VolImg.addEventListener("click", () => {
    clearTimeout(hideTimeout);
    VolumeRange.classList.toggle("active");

    if (VolumeRange.classList.contains("active")) {
      hideTimeout = setTimeout(() => {
        VolumeRange.classList.toggle("active");
      }, 3000);
    }
  });

  VolumeRange.addEventListener("mouseover", () => { clearTimeout(hideTimeout); });
  VolumeRange.addEventListener("mouseleave", () => {
    if (VolumeRange.classList.contains("active")) {
      hideTimeout = setTimeout(() => {
        VolumeRange.classList.toggle("active");
      }, 3000);
    }
  });

  let hamburger = document.querySelector(".hamburger");
  let left = document.querySelector(".left");
  hamburger.addEventListener("click", () => {
    if (!left.classList.contains("open")) {
      left.classList.toggle("open");
      hamburger.getElementsByTagName("img")[0].src = "./assets/svg/close.svg";
    } else {
      left.classList.toggle("open");
      hamburger.getElementsByTagName("img")[0].src = "./assets/svg/hamburger.svg";
    }
  });
}

main();