// Based on Mixxx default controller settings for
// Numark Mixtrack Mapping and Numark Mixtrack Pro Script Functions
//
// 1/11/2010 - v0.1 - Matteo <matteo@magm3.com>
// 5/18/2011 - Changed by James Ralston 
// 05/26/2012 to 06/27/2012 - Changed by Darío José Freije <dario2004@gmail.com>
//
// 30/10/2014  Einar Alex - einar@gmail.com
//
// 08/14/2021-08/17/2021 - Edited by datlaunchystark (DJ LaunchStar) and added 4 deck support/LEDs... yeah.
// Updated on 06/23/2022 by datlaunchystark on Mixxx 2.3.3 (mostly cleaned up the code)
// https://github.com/datlaunchystark
//
// Updated on 11/27/2022 by DJ KWKSND (changed a bunch of code)
// LEDs working better with scratching, reversing, end of tracks, and autoDJ
// (load tracks, press play on decks 1 and 2(dj console), click pause on one deck(mouse), click start autoDJ(mouse))
// (to make this better it needs the function for deck 1 and 2 to start with the script or with autoDJ but im unsure how to do that yet)
//
// **** MIXXX v2.3.3 ****
// Known Bugs:
//	Each slide/knob needs to be moved on Mixxx startup to match levels with the Mixxx UI.
//  Reverse button (mapped to 'Stutter') sometimes stickes on until repressed when stopped.
//
//  What should be working.
//	
//	Supports 4 decks
// 	---------------
//	Library Browse knob + Load A/B
//	Channel volume, cross fader, cue gain / mix, Master gain, filters, pitch and pitch bend
// 	JogWheel (Improved Animated LEDs by DJ KWKSND :D)
//  Scratch/CD mode toggle
//	Headphone output toggle 
//	Samples (Using 16 samples)
//	Effects (Using 4 effect units)
//	Cue
//			1-4. Hot cue
//	Loops
//			1. Loop in (Loop halves)
//			2. Loop out (Loop double)
//			3. Re-loop (Starts loop at current playback point)
//			4. Loop Delete (Deactivates loop)
//
//  Sync
//  All of the LEDs are functional? :D

function NumarkMixTrackQuad() {}

NumarkMixTrackQuad.init = function(id) {	// called when the MIDI device is opened & set up
	NumarkMixTrackQuad.id = id;	// Store the ID of this device for later use

	NumarkMixTrackQuad.directoryMode = false;
	NumarkMixTrackQuad.scratchMode = [false, false];
	NumarkMixTrackQuad.manualLoop = [true, true];
	NumarkMixTrackQuad.deleteKey = [false, false];
	NumarkMixTrackQuad.isKeyLocked = [0, 0];
	NumarkMixTrackQuad.touch = [false, false];
	NumarkMixTrackQuad.scratchTimer = [-1, -1];
	
	NumarkMixTrackQuad.jogled = [1];
	NumarkMixTrackQuad.reverse = [1];
	NumarkMixTrackQuad.flashOnceTimer = [0];
	NumarkMixTrackQuad.channel = [0];	
	
	///---------- Animated Intro Turns On All LEDs ------------------>>
	
	// Turns on jogWheel LEDs
	engine.beginTimer(100, "midi.sendShortMsg(0xB1, 0x3D, 1)", true);
	engine.beginTimer(200, "midi.sendShortMsg(0xB1, 0x3D, 2)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0xB1, 0x3D, 3)", true);
	engine.beginTimer(400, "midi.sendShortMsg(0xB1, 0x3D, 4)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0xB1, 0x3D, 5)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0xB1, 0x3D, 6)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0xB1, 0x3D, 7)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0xB1, 0x3D, 8)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0xB1, 0x3D, 9)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0xB1, 0x3D, 10)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0xB1, 0x3D, 11)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0xB1, 0x3D, 12)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0xB1, 0x3C, 1)", true);
	engine.beginTimer(1400, "midi.sendShortMsg(0xB1, 0x3C, 2)", true);
	engine.beginTimer(2200, "midi.sendShortMsg(0xB1, 0x3C, 3)", true);
	engine.beginTimer(2300, "midi.sendShortMsg(0xB1, 0x3C, 4)", true);
	engine.beginTimer(2400, "midi.sendShortMsg(0xB1, 0x3C, 5)", true);
	engine.beginTimer(2500, "midi.sendShortMsg(0xB1, 0x3C, 6)", true);
		
	engine.beginTimer(100, "midi.sendShortMsg(0xB2, 0x3D, 12)", true);
	engine.beginTimer(200, "midi.sendShortMsg(0xB2, 0x3D, 11)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0xB2, 0x3D, 10)", true);
	engine.beginTimer(400, "midi.sendShortMsg(0xB2, 0x3D, 9)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0xB2, 0x3D, 8)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0xB2, 0x3D, 7)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0xB2, 0x3D, 6)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0xB2, 0x3D, 5)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0xB2, 0x3D, 4)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0xB2, 0x3D, 3)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0xB2, 0x3D, 2)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0xB2, 0x3D, 1)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0xB2, 0x3C, 1)", true);
	engine.beginTimer(1400, "midi.sendShortMsg(0xB2, 0x3C, 2)", true);
	engine.beginTimer(2200, "midi.sendShortMsg(0xB2, 0x3C, 3)", true);
	engine.beginTimer(2300, "midi.sendShortMsg(0xB2, 0x3C, 4)", true);
	engine.beginTimer(2400, "midi.sendShortMsg(0xB2, 0x3C, 5)", true);
	engine.beginTimer(2500, "midi.sendShortMsg(0xB2, 0x3C, 6)", true);
	
	engine.beginTimer(100, "midi.sendShortMsg(0xB3, 0x3D, 1)", true);
	engine.beginTimer(200, "midi.sendShortMsg(0xB3, 0x3D, 2)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0xB3, 0x3D, 3)", true);
	engine.beginTimer(400, "midi.sendShortMsg(0xB3, 0x3D, 4)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0xB3, 0x3D, 5)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0xB3, 0x3D, 6)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0xB3, 0x3D, 7)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0xB3, 0x3D, 8)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0xB3, 0x3D, 9)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0xB3, 0x3D, 10)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0xB3, 0x3D, 11)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0xB3, 0x3D, 12)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0xB3, 0x3C, 1)", true);
	engine.beginTimer(1400, "midi.sendShortMsg(0xB3, 0x3C, 2)", true);
	engine.beginTimer(2200, "midi.sendShortMsg(0xB3, 0x3C, 3)", true);
	engine.beginTimer(2300, "midi.sendShortMsg(0xB3, 0x3C, 4)", true);
	engine.beginTimer(2400, "midi.sendShortMsg(0xB3, 0x3C, 5)", true);
	engine.beginTimer(2500, "midi.sendShortMsg(0xB3, 0x3C, 6)", true);
	
	engine.beginTimer(100, "midi.sendShortMsg(0xB4, 0x3D, 12)", true);
	engine.beginTimer(200, "midi.sendShortMsg(0xB4, 0x3D, 11)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0xB4, 0x3D, 10)", true);
	engine.beginTimer(400, "midi.sendShortMsg(0xB4, 0x3D, 9)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0xB4, 0x3D, 8)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0xB4, 0x3D, 7)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0xB4, 0x3D, 6)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0xB4, 0x3D, 5)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0xB4, 0x3D, 4)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0xB4, 0x3D, 3)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0xB4, 0x3D, 2)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0xB4, 0x3D, 1)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0xB4, 0x3C, 1)", true);
	engine.beginTimer(1400, "midi.sendShortMsg(0xB4, 0x3C, 2)", true);
	engine.beginTimer(2200, "midi.sendShortMsg(0xB4, 0x3C, 3)", true);
	engine.beginTimer(2300, "midi.sendShortMsg(0xB4, 0x3C, 4)", true);
	engine.beginTimer(2400, "midi.sendShortMsg(0xB4, 0x3C, 5)", true);
	engine.beginTimer(2500, "midi.sendShortMsg(0xB4, 0x3C, 6)", true);
	// Hey did it just smile at me? :D
	
	// Turns on Scratch LEDs
	engine.beginTimer(300, "midi.sendShortMsg(0x91, 0x48, 1)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0x92, 0x48, 1)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0x93, 0x48, 1)", true);
	engine.beginTimer(300, "midi.sendShortMsg(0x94, 0x48, 1)", true);
	
	// Turns on Headphone LEDs
	engine.beginTimer(500, "midi.sendShortMsg(0x91, 0x47, 1)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0x92, 0x47, 1)", true);
	engine.beginTimer(400, "midi.sendShortMsg(0x93, 0x47, 1)", true);
	engine.beginTimer(400, "midi.sendShortMsg(0x94, 0x47, 1)", true);
	
	// Turns on Sync LEDs
	engine.beginTimer(800, "midi.sendShortMsg(0x91, 0x40, 1)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0x92, 0x40, 1)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0x93, 0x40, 1)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0x94, 0x40, 1)", true);
	
	// Turns on Cue LEDs
	engine.beginTimer(700, "midi.sendShortMsg(0x91, 0x33, 1)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0x92, 0x33, 1)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0x93, 0x33, 1)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0x94, 0x33, 1)", true);

	// Turns on Play/Pause LEDs
	engine.beginTimer(600, "midi.sendShortMsg(0x91, 0x42, 1)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0x92, 0x42, 1)", true);
	engine.beginTimer(600, "midi.sendShortMsg(0x93, 0x42, 1)", true);
	engine.beginTimer(700, "midi.sendShortMsg(0x94, 0x42, 1)", true);
	
	// Turns on Stutter LEDs
	engine.beginTimer(500, "midi.sendShortMsg(0x91, 0x4A, 1)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0x92, 0x4A, 1)", true);
	engine.beginTimer(500, "midi.sendShortMsg(0x93, 0x4A, 1)", true);
	engine.beginTimer(800, "midi.sendShortMsg(0x94, 0x4A, 1)", true);
	
	// Turns on Pitch LEDs
	engine.beginTimer(900, "midi.sendShortMsg(0x91, 0x0D, 1)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0x92, 0x0D, 1)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0x93, 0x0D, 1)", true);
	engine.beginTimer(900, "midi.sendShortMsg(0x94, 0x0D, 1)", true);
		
	// Turns on FX1 LEDs
	engine.beginTimer(1000, "midi.sendShortMsg(0x91, 0x59, 1)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0x92, 0x59, 5)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0x93, 0x59, 1)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0x94, 0x59, 5)", true);
	
	// Turns on FX2 LEDs
	engine.beginTimer(1100, "midi.sendShortMsg(0x91, 0x5A, 2)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0x92, 0x5A, 6)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0x93, 0x5A, 2)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0x94, 0x5A, 6)", true);
	
	// Turns on FX3 LEDs
	engine.beginTimer(1200, "midi.sendShortMsg(0x91, 0x5B, 3)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0x92, 0x5B, 7)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0x93, 0x5B, 3)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0x94, 0x5B, 7)", true);
	
	// Turns on Reset LEDs
	engine.beginTimer(1300, "midi.sendShortMsg(0x91, 0x5C, 4)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0x92, 0x5C, 8)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0x93, 0x5C, 4)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0x94, 0x5C, 8)", true);
	
	// Turns on Loop_IN LEDs
	engine.beginTimer(1000, "midi.sendShortMsg(0x91, 0x53, 9)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0x92, 0x53, 13)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0x93, 0x53, 9)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0x94, 0x53, 13)", true);
	
	// Turns on Loop_OUT LEDs
	engine.beginTimer(1100, "midi.sendShortMsg(0x91, 0x54, 10)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0x92, 0x54, 14)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0x93, 0x54, 10)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0x94, 0x54, 14)", true);
	
	// Turns on Reloop LEDs
	engine.beginTimer(1200, "midi.sendShortMsg(0x91, 0x55, 11)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0x92, 0x55, 15)", true);
	engine.beginTimer(1200, "midi.sendShortMsg(0x93, 0x55, 11)", true);
	engine.beginTimer(1100, "midi.sendShortMsg(0x94, 0x55, 15)", true);
	
	// Turns on Loop_Size LEDs
	engine.beginTimer(1300, "midi.sendShortMsg(0x91, 0x63, 12)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0x92, 0x63, 16)", true);
	engine.beginTimer(1300, "midi.sendShortMsg(0x93, 0x63, 12)", true);
	engine.beginTimer(1000, "midi.sendShortMsg(0x94, 0x63, 16)", true);
	
	// Turns on Folder/File LEDs
	engine.beginTimer(1400, "midi.sendShortMsg(0x90, 0x4B, 1)", true);
	engine.beginTimer(1400, "midi.sendShortMsg(0x90, 0x4C, 1)", true);
	
	///---------------- Turns off unused LEDs ----------------------->>
	
	// Turns off jogWheel LEDs
	engine.beginTimer(3500, "midi.sendShortMsg(0xB1, 0x3C, 0)", true);
	engine.beginTimer(3500, "midi.sendShortMsg(0xB2, 0x3C, 0)", true);
	engine.beginTimer(3500, "midi.sendShortMsg(0xB3, 0x3C, 0)", true);
	engine.beginTimer(3500, "midi.sendShortMsg(0xB4, 0x3C, 0)", true);
	
	// Turns off Scratch LEDs
	engine.beginTimer(3600, "midi.sendShortMsg(0x91, 0x48, 0)", true);
	engine.beginTimer(3600, "midi.sendShortMsg(0x92, 0x48, 0)", true);
	engine.beginTimer(3600, "midi.sendShortMsg(0x93, 0x48, 0)", true);
	engine.beginTimer(3600, "midi.sendShortMsg(0x94, 0x48, 0)", true);
	
	// Turns off Headphone LEDs
	engine.beginTimer(3700, "midi.sendShortMsg(0x91, 0x47, 0)", true);
	engine.beginTimer(3700, "midi.sendShortMsg(0x92, 0x47, 0)", true);
	engine.beginTimer(3700, "midi.sendShortMsg(0x93, 0x47, 0)", true);
	engine.beginTimer(3700, "midi.sendShortMsg(0x94, 0x47, 0)", true);
	
	// Turns off Sync LEDs
	engine.beginTimer(3800, "midi.sendShortMsg(0x91, 0x40, 0)", true);
	engine.beginTimer(3800, "midi.sendShortMsg(0x92, 0x40, 0)", true);
	engine.beginTimer(3800, "midi.sendShortMsg(0x93, 0x40, 0)", true);
	engine.beginTimer(3800, "midi.sendShortMsg(0x94, 0x40, 0)", true);
		
	// Turns off Play/Pause LEDs
	engine.beginTimer(3900, "midi.sendShortMsg(0x91, 0x42, 0)", true);
	engine.beginTimer(3900, "midi.sendShortMsg(0x92, 0x42, 0)", true);
	engine.beginTimer(3900, "midi.sendShortMsg(0x93, 0x42, 0)", true);
	engine.beginTimer(3900, "midi.sendShortMsg(0x94, 0x42, 0)", true);
	
	// Turns off Stutter LEDs
	engine.beginTimer(4000, "midi.sendShortMsg(0x91, 0x4A, 0)", true);
	engine.beginTimer(4000, "midi.sendShortMsg(0x92, 0x4A, 0)", true);
	engine.beginTimer(4000, "midi.sendShortMsg(0x93, 0x4A, 0)", true);
	engine.beginTimer(4000, "midi.sendShortMsg(0x94, 0x4A, 0)", true);
	
	// Turns off FX1 LEDs
	engine.beginTimer(4100, "midi.sendShortMsg(0x91, 0x59, 0)", true);
	engine.beginTimer(4100, "midi.sendShortMsg(0x92, 0x59, 0)", true);
	engine.beginTimer(4100, "midi.sendShortMsg(0x93, 0x59, 0)", true);
	engine.beginTimer(4100, "midi.sendShortMsg(0x94, 0x59, 0)", true);
	
	// Turns off FX2 LEDs
	engine.beginTimer(4200, "midi.sendShortMsg(0x91, 0x5A, 0)", true);
	engine.beginTimer(4200, "midi.sendShortMsg(0x92, 0x5A, 0)", true);
	engine.beginTimer(4200, "midi.sendShortMsg(0x93, 0x5A, 0)", true);
	engine.beginTimer(4200, "midi.sendShortMsg(0x94, 0x5A, 0)", true);
	
	// Turns off FX3 LEDs
	engine.beginTimer(4300, "midi.sendShortMsg(0x91, 0x5B, 0)", true);
	engine.beginTimer(4300, "midi.sendShortMsg(0x92, 0x5B, 0)", true);
	engine.beginTimer(4300, "midi.sendShortMsg(0x93, 0x5B, 0)", true);
	engine.beginTimer(4300, "midi.sendShortMsg(0x94, 0x5B, 0)", true);
	
	// Turns off Reset LEDs
	engine.beginTimer(4400, "midi.sendShortMsg(0x91, 0x5C, 6)", true);
	engine.beginTimer(4400, "midi.sendShortMsg(0x92, 0x5C, 6)", true);
	engine.beginTimer(4400, "midi.sendShortMsg(0x93, 0x5C, 6)", true);
	engine.beginTimer(4400, "midi.sendShortMsg(0x94, 0x5C, 6)", true);
	
	// Turns off Loop_IN LEDs
	engine.beginTimer(4500, "midi.sendShortMsg(0x91, 0x53, 14)", true);
	engine.beginTimer(4500, "midi.sendShortMsg(0x92, 0x53, 14)", true);
	engine.beginTimer(4500, "midi.sendShortMsg(0x93, 0x53, 14)", true);
	engine.beginTimer(4500, "midi.sendShortMsg(0x94, 0x53, 14)", true);
	
	// Turns off Loop_OUT LEDs
	engine.beginTimer(4600, "midi.sendShortMsg(0x91, 0x54, 14)", true);
	engine.beginTimer(4600, "midi.sendShortMsg(0x92, 0x54, 14)", true);
	engine.beginTimer(4600, "midi.sendShortMsg(0x93, 0x54, 14)", true);
	engine.beginTimer(4600, "midi.sendShortMsg(0x94, 0x54, 14)", true);
	
	// Turns off Reloop LEDs
	engine.beginTimer(4700, "midi.sendShortMsg(0x91, 0x55, 8)", true);
	engine.beginTimer(4700, "midi.sendShortMsg(0x92, 0x55, 8)", true);
	engine.beginTimer(4700, "midi.sendShortMsg(0x93, 0x55, 8)", true);
	engine.beginTimer(4700, "midi.sendShortMsg(0x94, 0x55, 8)", true);
	
	// Turns off Loop_Size LEDs
	engine.beginTimer(4800, "midi.sendShortMsg(0x91, 0x63, 1)", true);
	engine.beginTimer(4800, "midi.sendShortMsg(0x92, 0x63, 1)", true);
	engine.beginTimer(4800, "midi.sendShortMsg(0x93, 0x63, 1)", true);
	engine.beginTimer(4800, "midi.sendShortMsg(0x94, 0x63, 1)", true);
	
	// Turns off Folder/File LEDs
	engine.beginTimer(4900, "midi.sendShortMsg(0x90, 0x4B, 0)", true);
	engine.beginTimer(4900, "midi.sendShortMsg(0x90, 0x4C, 1)", true);
	
	NumarkMixTrackQuad.leds = [
		// Common
		{ "directory": 0x4B, "file": 0x4C },
	];
	// NumarkMixTrackQuad.flashOnceOn(deck, group) i need a way to add this line here for deck 1&2	
	// would require the deck and group vars at this stage, if not can it be set when autoDJ starts?
}

NumarkMixTrackQuad.shutdown = function() {
	
	// Turns off all LEDs -------->>>
   
	// Turns off jogWheel LEDs
	midi.sendShortMsg(0xB1, 0x3C, 0);
	midi.sendShortMsg(0xB2, 0x3C, 0);
	midi.sendShortMsg(0xB3, 0x3C, 0);
	midi.sendShortMsg(0xB4, 0x3C, 0);
	
	// Turns off Sync LEDs
	midi.sendShortMsg(0x91, 0x40, 0);
	midi.sendShortMsg(0x92, 0x40, 0);
	midi.sendShortMsg(0x93, 0x40, 0);
	midi.sendShortMsg(0x94, 0x40, 0);
	
	// Turns off Cue LEDs
	midi.sendShortMsg(0x91, 0x33, 0);
	midi.sendShortMsg(0x92, 0x33, 0);
	midi.sendShortMsg(0x93, 0x33, 0);
	midi.sendShortMsg(0x94, 0x33, 0);

	// Turns off Play/Pause LEDs
	midi.sendShortMsg(0x91, 0x42, 0);
	midi.sendShortMsg(0x92, 0x42, 0);
	midi.sendShortMsg(0x93, 0x42, 0);
	midi.sendShortMsg(0x94, 0x42, 0);
	
	// Turns off Stutter LEDs
	midi.sendShortMsg(0x91, 0x4A, 0);
	midi.sendShortMsg(0x92, 0x4A, 0);
	midi.sendShortMsg(0x93, 0x4A, 0);
	midi.sendShortMsg(0x94, 0x4A, 0);
	
	// Turns off Scratch LEDs
	midi.sendShortMsg(0x91, 0x48, 0);
	midi.sendShortMsg(0x92, 0x48, 0);
	midi.sendShortMsg(0x93, 0x48, 0);
	midi.sendShortMsg(0x94, 0x48, 0);
	
	// Turns off Pitch LEDs
	midi.sendShortMsg(0x91, 0x0D, 0);
	midi.sendShortMsg(0x92, 0x0D, 0);
	midi.sendShortMsg(0x93, 0x0D, 0);
	midi.sendShortMsg(0x94, 0x0D, 0);
	
	// Turns off Headphone LEDs
	midi.sendShortMsg(0x91, 0x47, 0);
	midi.sendShortMsg(0x92, 0x47, 0);
	midi.sendShortMsg(0x93, 0x47, 0);
	midi.sendShortMsg(0x94, 0x47, 0);
	
	// Turns off FX1 LEDs
	midi.sendShortMsg(0x91, 0x59, 0);
	midi.sendShortMsg(0x92, 0x59, 0);
	midi.sendShortMsg(0x93, 0x59, 0);
	midi.sendShortMsg(0x94, 0x59, 0);
	
	// Turns off FX2 LEDs
	midi.sendShortMsg(0x91, 0x5A, 0);
	midi.sendShortMsg(0x92, 0x5A, 0);
	midi.sendShortMsg(0x93, 0x5A, 0);
	midi.sendShortMsg(0x94, 0x5A, 0);
	
	// Turns off FX3 LEDs
	midi.sendShortMsg(0x91, 0x5B, 0);
	midi.sendShortMsg(0x92, 0x5B, 0);
	midi.sendShortMsg(0x93, 0x5B, 0);
	midi.sendShortMsg(0x94, 0x5B, 0);
	
	// Turns off Reset LEDs
	midi.sendShortMsg(0x91, 0x5C, 0);
	midi.sendShortMsg(0x92, 0x5C, 0);
	midi.sendShortMsg(0x93, 0x5C, 0);
	midi.sendShortMsg(0x94, 0x5C, 0);
	
	// Turns off Loop_IN LEDs
	midi.sendShortMsg(0x91, 0x53, 0);
	midi.sendShortMsg(0x92, 0x53, 0);
	midi.sendShortMsg(0x93, 0x53, 0);
	midi.sendShortMsg(0x94, 0x53, 0);
	
	// Turns off Loop_OUT LEDs
	midi.sendShortMsg(0x91, 0x54, 0);
	midi.sendShortMsg(0x92, 0x54, 0);
	midi.sendShortMsg(0x93, 0x54, 0);
	midi.sendShortMsg(0x94, 0x54, 0);
	
	// Turns off Reloop LEDs
	midi.sendShortMsg(0x91, 0x55, 0);
	midi.sendShortMsg(0x92, 0x55, 0);
	midi.sendShortMsg(0x93, 0x55, 0);
	midi.sendShortMsg(0x94, 0x55, 0);
	
	// Turns off Loop_Size LEDs
	midi.sendShortMsg(0x91, 0x63, 0);
	midi.sendShortMsg(0x92, 0x63, 0);
	midi.sendShortMsg(0x93, 0x63, 0);
	midi.sendShortMsg(0x94, 0x63, 0);
	
	// Turns off Folder/File LEDs
	midi.sendShortMsg(0x90, 0x4B, 0);
	midi.sendShortMsg(0x90, 0x4C, 0);
}

NumarkMixTrackQuad.setLED = function(value, status) {
	status = status ? 0x7F : 0x00;
	midi.sendShortMsg(0x90, value, status);
}

NumarkMixTrackQuad.groupToDeck = function(group) {
	var matches = group.match(/^\[Channel(\d+)\]$/);
	if (matches == null) {
		return -1;
	} else {
		return matches[1];
	}
}

NumarkMixTrackQuad.selectKnob = function(channel, control, value, status, group) {
	if (value > 63) {
		value = value - 128;
	}
	if (NumarkMixTrackQuad.directoryMode) {
		if (value > 0) {
			for (var i = 0; i < value; i++) {
				engine.setValue(group, "SelectNextPlaylist", 1);
			}
		} else {
			for (var i = 0; i < -value; i++) {
				engine.setValue(group, "SelectPrevPlaylist", 1);
			}
		}
	} else {
		engine.setValue(group, "SelectTrackKnob", value);
	}
}

NumarkMixTrackQuad.flashOnceOn = function(deck, group) {	
	engine.stopTimer(NumarkMixTrackQuad.flashOnceTimer[deck-1]);
	if (engine.getValue(group, "play", 1)) {
		midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3D, NumarkMixTrackQuad.jogled[deck-1]);
	}else{
		midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3C, 0);
	}
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = engine.beginTimer(50, "NumarkMixTrackQuad.flashOnceOff('" + deck + "', '" + group + "')", true);
};

NumarkMixTrackQuad.flashOnceOff = function(deck, group) {	
	NumarkMixTrackQuad.jogled[deck-1] = NumarkMixTrackQuad.jogled[deck-1] + NumarkMixTrackQuad.reverse[deck-1]
	if (NumarkMixTrackQuad.jogled[deck-1] > 12.99) {
		NumarkMixTrackQuad.jogled[deck-1] = 1;
	} else if (NumarkMixTrackQuad.jogled[deck-1] < 1) {
		NumarkMixTrackQuad.jogled[deck-1] = 12.99;
	}
	NumarkMixTrackQuad.flashOnceOn(deck, group)
};

NumarkMixTrackQuad.playbutton = function(channel, control, value, status, group) {
	if (!value) return;
	
	var deck = NumarkMixTrackQuad.groupToDeck(group);
		
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = 0;
	NumarkMixTrackQuad.jogled[deck-1] = 1;

	if (engine.getValue(group, "play")) {
		engine.setValue(group, "play", 0);
	}else{
		engine.setValue(group, "play", 1);
	}
	if (engine.getValue(group, "play", 1)) {
		NumarkMixTrackQuad.channel[deck-1] = channel;
		NumarkMixTrackQuad.reverse[deck-1] = 1;
		NumarkMixTrackQuad.flashOnceOn(deck, group)
	}else{
		NumarkMixTrackQuad.channel[deck-1] = 0
		midi.sendShortMsg(0xB0+(channel), 0x3C, 0);
	}
}

NumarkMixTrackQuad.reversebutton = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if (engine.getValue(group, "play")) {
		if (engine.getValue(group, "reverse")) {
			engine.setValue(group, "reverse", 0);
		}else{
			engine.setValue(group, "reverse", 1);
		}

		if (engine.getValue(group, "reverse", 1)) {
			NumarkMixTrackQuad.reverse[deck-1] = -1;
		}else{
			NumarkMixTrackQuad.reverse[deck-1] = 1;
		}
	}else{
		if (engine.getValue(group, "reverse"), 1) {
			engine.setValue(group, "reverse", 0);
		}
	}
}

NumarkMixTrackQuad.cuebutton = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	// Don't set Cue accidentaly at the end of the song
	if (engine.getValue(group, "playposition") <= 0.97) {
			engine.setValue(group, "cue_default", value ? 1 : 0);
			NumarkMixTrackQuad.channel[deck-1] = 0;
			midi.sendShortMsg(0xB0+(channel), 0x3C, 0);
	} else {
		engine.setValue(group, "cue_preview", value ? 1 : 0);
	}
}

NumarkMixTrackQuad.jogWheel = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	NumarkMixTrackQuad.reverse[deck-1] = 0;
	var adjustedJog = parseFloat(value);
	var posNeg = 1;
	if (adjustedJog > 63) {	// Counter-clockwise
		posNeg = -1;
		adjustedJog = value - 128;
	}

	if (engine.getValue(group, "play")) {

		if (NumarkMixTrackQuad.scratchMode[deck-1] && posNeg == -1 && !NumarkMixTrackQuad.touch[deck-1]) {
			if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch(" + deck + ")", true);
		} 

	} else { 
	
		if (!NumarkMixTrackQuad.touch[deck-1]){
			if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch(" + deck + ")", true);
		}
	}

	engine.scratchTick(deck, adjustedJog);

	if (engine.getValue(group,"play")) {
		var gammaInputRange = 13;	// Max jog speed
		var maxOutFraction = 0.8;	// Where on the curve it should peak; 0.5 is half-way
		var sensitivity = 0.5;		// Adjustment gamma
		var gammaOutputRange = 2;	// Max rate change

		adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity);
		engine.setValue(group, "jog", adjustedJog);
		
		if (NumarkMixTrackQuad.scratchMode[deck-1] == 1) { 
			NumarkMixTrackQuad.reverse[deck-1] = 0;
			if (posNeg < 0) {	// Counter-clockwise
				NumarkMixTrackQuad.reverse[deck-1] = -0.25;
			} else {
				NumarkMixTrackQuad.reverse[deck-1] = 0.25;
			}
		}
		if (NumarkMixTrackQuad.touch[deck-1] == 0) {
			NumarkMixTrackQuad.reverse[deck-1] = 1;
			if (engine.getValue(group,"reverse") == 1) {
				NumarkMixTrackQuad.reverse[deck-1] = -1;
			}
		}
	}
}

NumarkMixTrackQuad.jogWheelStopScratch = function(deck) {
	NumarkMixTrackQuad.scratchTimer[deck-1] = -1;
	engine.scratchDisable(deck);
	NumarkMixTrackQuad.reverse[deck-1] = 1;
}

NumarkMixTrackQuad.wheelTouch = function(channel, control, value, status, group){

	var deck = NumarkMixTrackQuad.groupToDeck(group);
			NumarkMixTrackQuad.reverse[deck-1] = 0;

	if(!value){
		if (engine.getValue(group, "play", 1)) {
			
		}else{
			midi.sendShortMsg(0xB0+(channel), 0x3C, 0);
		}
		NumarkMixTrackQuad.touch[deck-1]= false;

		if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);

		NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch(" + deck + ")", true);

	} else {
		if (engine.getValue(group, "play", 1)) {
			
		}else{
			midi.sendShortMsg(0xB0+(channel), 0x3C, 6);
		}
		if (!NumarkMixTrackQuad.scratchMode[deck-1] && engine.getValue(group, "play")) return;

		// Save the current state of the keylock
		NumarkMixTrackQuad.isKeyLocked[deck-1] = engine.getValue(group, "keylock");
		// Turn the Keylock off for scratching
		if (NumarkMixTrackQuad.isKeyLocked[deck-1]){
			engine.setValue(group, "keylock", 0);
		}


		if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);

		// change the 600 value for sensibility
		engine.scratchEnable(deck, 600, 33+1/3, 1.0/8, (1.0/8)/32);

		NumarkMixTrackQuad.touch[deck-1]= true;
	}
}

NumarkMixTrackQuad.toggleDirectoryMode = function(channel, control, value, status, group) {
	// Toggle setting and light
	if (value) {
		NumarkMixTrackQuad.directoryMode = !NumarkMixTrackQuad.directoryMode;

		NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["directory"], NumarkMixTrackQuad.directoryMode);
		NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["file"], !NumarkMixTrackQuad.directoryMode);
	}
}

NumarkMixTrackQuad.toggleScratchMode = function(channel, control, value, status, group) {
	if (!value) return;

	var deck = NumarkMixTrackQuad.groupToDeck(group);
	// Toggle setting and light
	NumarkMixTrackQuad.scratchMode[deck-1] = !NumarkMixTrackQuad.scratchMode[deck-1];
	if(NumarkMixTrackQuad.scratchMode[deck-1])
	{
		midi.sendShortMsg(status, control, 0x7F); 
	}
	else 
	{
		midi.sendShortMsg(status, control, 0x00);
	}
}
