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
// Updated on 06/22/2022 by datlaunchystark on Mixxx 2.3.3
// https://github.com/datlaunchystark

// **** MIXXX v2.3.0 ****
// Known Bugs:
//	Each slide/knob needs to be moved on Mixxx startup to match levels with the Mixxx UI.
//  Jog Wheel animations sometimes don't revert to original animation after scratching.  They also don't shut off when a track finishes.
//  Reverse button (mapped to 'Stutter') sometimes stickes on until repressed when stopped.
//
//  What should be working.
//	
//	Supports 4 decks
// 	---------------
//	Library Browse knob + Load A/B
//	Channel volume, cross fader, cue gain / mix, Master gain, filters, pitch and pitch bend
// 	JogWheel 													(Animated LEDs :D)
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
//  Most of the LEDs are functional too. :)

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
	NumarkMixTrackQuad.jogledstatus = [0];
	
	
	// Turns off jogWheel LEDs
	midi.sendShortMsg(0xB1, 0x3C, 0);
	midi.sendShortMsg(0xB2, 0x3C, 0);
	midi.sendShortMsg(0xB3, 0x3C, 0);
	midi.sendShortMsg(0xB4, 0x3C, 0);
	
	// Turns off Scratch LEDs
	midi.sendShortMsg(0x91, 0x48, 0);
	midi.sendShortMsg(0x92, 0x48, 0);
	midi.sendShortMsg(0x93, 0x48, 0);
	midi.sendShortMsg(0x94, 0x48, 0);
	
	NumarkMixTrackQuad.leds = [
		// Common
		{ "directory": 0x4B, "file": 0x4C },
		// Deck 1
		{ "rate": 0x70, "scratchMode": 0x48, "manualLoop": 0x61, 
		"loop_start_position": 0x53, "loop_end_position": 0x54, "reloop_exit": 0x55,
		"deleteKey" : 0x59, "hotCue1" : 0x6D,"hotCue2" : 0x6E,"hotCue3" :  0x6F,
		"stutter" : 0x4a, "Cue" : 0x33, "sync" : 0x40,
		},
		// Deck 2
		{ "rate": 0x71, "scratchMode": 0x48, "manualLoop": 0x62, 
		"loop_start_position": 0x56, "loop_end_position": 0x57, "reloop_exit": 0x58,
		"deleteKey" : 0x5d, "hotCue1" : 0x6D, "hotCue2" : 0x6E, "hotCue3" :  0x6F,
		"stutter" : 0x4c, "Cue" : 0x3c, "sync" : 0x47,
		 }
	];
	
	NumarkMixTrackQuad.ledTimers = {};

	NumarkMixTrackQuad.LedTimer = function(id, led, count, state){
		this.id = id;
		this.led = led;
		this.count = count;
		this.state = state;
	}

	for (i=0x30; i<=0x73; i++) midi.sendShortMsg(0x90, i, 0x00); 	// Turn off all the lights

	NumarkMixTrackQuad.hotCue = {
			//Deck 1 
			0x6D:"1", 0x6E:"2", 0x6F:"3",
			//Deck 2
			0x6D: "1", 0x6E:"2", 0x6F:"3"
			};
	NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["file"], true);

// Enable soft-takeover for Pitch slider

	engine.softTakeover("[Channel1]", "rate", true);
	engine.softTakeover("[Channel2]", "rate", true);


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

NumarkMixTrackQuad.flashOnceOn = function(deck, control, value, group) {
	NumarkMixTrackQuad.jogled[deck-1] = NumarkMixTrackQuad.jogled[deck-1] + NumarkMixTrackQuad.reverse[deck-1]
	midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3D, NumarkMixTrackQuad.jogled[deck-1]);
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = engine.beginTimer(25, "NumarkMixTrackQuad.flashOnceOff(" + deck + ")", true);
};

NumarkMixTrackQuad.flashOnceOff = function(deck, control, value, group) {
	if (NumarkMixTrackQuad.jogled[deck-1] >= 13) {
		NumarkMixTrackQuad.jogled[deck-1] = 1;
	}
	if (NumarkMixTrackQuad.jogled[deck-1] < 1) {
		NumarkMixTrackQuad.jogled[deck-1] = 12;
	}
	engine.stopTimer(NumarkMixTrackQuad.flashOnceTimer[deck-1]);
	if (NumarkMixTrackQuad.jogledstatus[deck-1] == 1) {
		NumarkMixTrackQuad.flashOnceOn(deck, value, group)
	}
};


NumarkMixTrackQuad.playbutton = function(channel, control, value, status, group) {
	if (!value) return;
	
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	
	NumarkMixTrackQuad.jogledstatus[deck-1] = 0
	
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = 0;
	NumarkMixTrackQuad.jogled[deck-1] = 1;

	if (engine.getValue(group, "play")) {
		engine.setValue(group, "play", 0);
	}else{
		engine.setValue(group, "play", 1);
	}

	if (engine.getValue(group, "play", 1)) {
		NumarkMixTrackQuad.channel[deck-1] = channel;
		NumarkMixTrackQuad.jogledstatus[deck-1] = 1
		NumarkMixTrackQuad.reverse[deck-1] = 1;
		NumarkMixTrackQuad.flashOnceOn(deck, control, value, group)
	}else{
		NumarkMixTrackQuad.channel[deck-1] = 0
		NumarkMixTrackQuad.jogledstatus[deck-1] = 0
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
			NumarkMixTrackQuad.reverse[deck-1] = adjustedJog / 1.5;
		}
		if (NumarkMixTrackQuad.touch[deck-1] == 0) {
			if (engine.getValue(group,"reverse") == 1) {
				NumarkMixTrackQuad.reverse[deck-1] = -1;
			}else {
				NumarkMixTrackQuad.reverse[deck-1] = 1;
			}
		}
	}
}

NumarkMixTrackQuad.jogWheelStopScratch = function(deck) {
	NumarkMixTrackQuad.scratchTimer[deck-1] = -1;
	engine.scratchDisable(deck);

		if (NumarkMixTrackQuad.isKeyLocked[deck-1] == 1) {
			// Restore the previous state of the Keylock
			engine.setValue("[Channel"+deck+"]", "keylock", NumarkMixTrackQuad.isKeyLocked[deck-1]);
			NumarkMixTrackQuad.isKeyLocked[deck-1] = 0;
		}
		
}

NumarkMixTrackQuad.wheelTouch = function(channel, control, value, status, group){

	var deck = NumarkMixTrackQuad.groupToDeck(group);

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
