// Music Player Module - Load and play custom music files

const MusicPlayer = {
    musicList: [],
    currentTrack: null,
    isPlaying: false,
    volume: 0.5,
    musicFolder: null,
    
    init() {
        // Create music folder in mod directory
        try {
            this.musicFolder = Vars.modDirectory.child("hackdustry-music");
            if (!this.musicFolder.exists()) {
                this.musicFolder.mkdirs();
                print("[Hackdustry Music] Created music folder at: " + this.musicFolder.absolutePath());
            }
            this.scanMusicFolder();
        } catch (e) {
            print("[Hackdustry Music] Error creating music folder: " + e);
        }
    },
    
    // Scan music folder for audio files
    scanMusicFolder() {
        this.musicList = [];
        
        if (!this.musicFolder || !this.musicFolder.exists()) {
            print("[Hackdustry Music] Music folder not found");
            return;
        }
        
        try {
            const files = this.musicFolder.list();
            for (let i = 0; i < files.length; i++) {
                const file = this.musicFolder.child(files[i]);
                const fileName = file.name();
                
                // Check if it's a supported audio format
                if (fileName.endsWith(".ogg") || fileName.endsWith(".mp3") || 
                    fileName.endsWith(".wav") || fileName.endsWith(".flac")) {
                    
                    this.musicList.push({
                        name: fileName.substring(0, fileName.lastIndexOf(".")),
                        fileName: fileName,
                        file: file,
                        music: null
                    });
                }
            }
            
            print("[Hackdustry Music] Found " + this.musicList.length + " music files");
        } catch (e) {
            print("[Hackdustry Music] Error scanning folder: " + e);
        }
    },
    
    // Load a music file
    loadMusic(trackData) {
        try {
            if (!trackData.music) {
                // Load the music file
                trackData.music = new Music(Vars.tree.get(trackData.file.path()));
            }
            return trackData.music;
        } catch (e) {
            print("[Hackdustry Music] Error loading music: " + e);
            return null;
        }
    },
    
    // Play a specific track
    play(trackName) {
        const track = this.musicList.find(t => t.name === trackName);
        if (!track) {
            Vars.ui.showInfoFade(I18n.format("track-not-found", trackName));
            return false;
        }
        
        // Stop current track
        this.stop();
        
        // Load and play new track
        const music = this.loadMusic(track);
        if (music) {
            music.setVolume(this.volume);
            music.setLooping(true);
            music.play();
            
            this.currentTrack = track;
            this.isPlaying = true;
            
            Vars.ui.showInfoFade(I18n.format("now-playing", track.name));
            return true;
        }
        
        return false;
    },
    
    // Stop current track
    stop() {
        if (this.currentTrack && this.currentTrack.music) {
            this.currentTrack.music.stop();
        }
        this.isPlaying = false;
        this.currentTrack = null;
    },
    
    // Pause/Resume
    togglePause() {
        if (!this.currentTrack || !this.currentTrack.music) return false;
        
        if (this.isPlaying) {
            this.currentTrack.music.pause();
            this.isPlaying = false;
            Vars.ui.showInfoFade("@hackdustry.music-paused");
        } else {
            this.currentTrack.music.play();
            this.isPlaying = true;
            Vars.ui.showInfoFade("@hackdustry.music-resumed");
        }
        return true;
    },
    
    // Set volume (0.0 - 1.0)
    setVolume(vol) {
        this.volume = Mathf.clamp(vol, 0, 1);
        if (this.currentTrack && this.currentTrack.music) {
            this.currentTrack.music.setVolume(this.volume);
        }
        HackdustrySettings.set("music_volume", this.volume);
    },
    
    // Play next track
    next() {
        if (this.musicList.length === 0) return false;
        
        let currentIndex = this.musicList.indexOf(this.currentTrack);
        let nextIndex = (currentIndex + 1) % this.musicList.length;
        
        this.play(this.musicList[nextIndex].name);
        return true;
    },
    
    // Play previous track
    previous() {
        if (this.musicList.length === 0) return false;
        
        let currentIndex = this.musicList.indexOf(this.currentTrack);
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = this.musicList.length - 1;
        
        this.play(this.musicList[prevIndex].name);
        return true;
    },
    
    // Play random track
    shuffle() {
        if (this.musicList.length === 0) return false;
        
        const randomIndex = Mathf.random(0, this.musicList.length - 1);
        this.play(this.musicList[randomIndex].name);
        return true;
    },
    
    // Get music folder path
    getMusicFolderPath() {
        return this.musicFolder ? this.musicFolder.absolutePath() : "Unknown";
    },
    
    // Open music folder in file explorer (mobile-friendly info)
    showMusicFolderInfo() {
        const path = this.getMusicFolderPath();
        const dialog = new BaseDialog(I18n.get("music-folder", "Music Folder"));
        
        dialog.cont.add(I18n.get("music-folder-info", "Place your music files here:")).row();
        dialog.cont.add("[accent]" + path).row();
        dialog.cont.add("").padTop(10).row();
        dialog.cont.add(I18n.get("supported-formats", "Supported: .ogg, .mp3, .wav, .flac")).row();
        dialog.cont.add(I18n.get("found-tracks", "Found") + ": " + this.musicList.length).padTop(10).row();
        
        dialog.buttons.button("@hackdustry.rescan", Icon.refresh, () => {
            this.scanMusicFolder();
            Vars.ui.showInfoFade(I18n.format("rescanned", this.musicList.length));
            dialog.hide();
        }).size(200, 60);
        
        dialog.buttons.button("@close", Icon.cancel, () => {
            dialog.hide();
        }).size(200, 60);
        
        dialog.show();
    }
};

// Init is called from main.js after ClientLoadEvent require() — do not re-register ClientLoadEvent here
this.global.MusicPlayerModule = MusicPlayer;
