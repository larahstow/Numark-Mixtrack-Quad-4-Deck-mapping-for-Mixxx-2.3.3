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
//
// Numark Mixtrack Quad 4 Deck mapping for Mixxx 2.3.3
//
// Whats New?
//  New colors on most pads
//  Fully animated LEDs
//  Beautiful intro on Mixxx startup
//  Idle mode added to keep the LED show going until you start DJing
//  LEDs work with scratching, end of track, and AutoDJ
//  Shutdown function added to turn off all possible LEDs with Mixxx app shutdown
//  Improved controls and LED animation with scratching especially in reverse
//  FX 123 knobs now change what effects are assigned to the pads, 4th knob still controls gain so it works great
//
// Features:
//  Supports 4 decks
//  Library browse knob + load A/B
//  Channel volume, cross fader, cue gain / mix, Master gain, filters, pitch and pitch bend
//  Scratch/CD mode toggle
//  Headphone output toggle
//  Samples (Using 16 samples)
//  Effects (Using 4 effect units)
//  Cue 1-4 hot cues
//
//  Loops
//   (1) Loop in (Loop halves)
//   (2) Loop out (Loop double)
//   (3) Re-loop (Starts loop at current playback point)
//   (4) Loop Delete (Deactivates loop)
//
// Known Bugs:
//  Each slide/knob needs to be moved on Mixxx startup to match levels with the Mixxx UI.
//  LEDs wont animate on deck 2 with AutoDJ? (Load track in deck 2, play deck 2(controller), click AutoDJ)

engine.beginTimer(1, "NumarkMixTrackQuad.shutdown()", true);
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
	NumarkMixTrackQuad.untouched = [1];
	NumarkMixTrackQuad.lightShow ()

	NumarkMixTrackQuad.leds = [
		{ "directory": 0x4B, "file": 0x4C },
	];
	
	engine.beginTimer(5000, "NumarkMixTrackQuad.kwkautodjfix('[Channel1]') ", true); // FINALLY got deck 1 working with autoDJ no input required
	engine.beginTimer(5000, "NumarkMixTrackQuad.kwkautodjfix('[Channel2]') ", true); // WTF why does deck2 not work with the same code OMG
}

NumarkMixTrackQuad.kwkautodjfix = function(group) {
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if (group == '[Channel1]') {
		NumarkMixTrackQuad.channel[deck-1] = 1;
	}
	if (group == '[Channel2]') {
		NumarkMixTrackQuad.channel[deck-1] = 2;  // how does this not work? wtf my head hertz :(
	}
	NumarkMixTrackQuad.flashOnceOn(deck, group)
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
	NumarkMixTrackQuad.untouched = 0;
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
	if (NumarkMixTrackQuad.flashOnceTimer[deck-1]) {
		engine.stopTimer(NumarkMixTrackQuad.flashOnceTimer[deck-1]);
	}
	if (engine.getValue(group, "play", 1)) {
		midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3D, NumarkMixTrackQuad.jogled[deck-1]);
	}else{
		midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3C, 0);
	}
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = engine.beginTimer(50, "NumarkMixTrackQuad.flashOnceOff('" + deck + "', '" + group + "')", true);
}

NumarkMixTrackQuad.flashOnceOff = function(deck, group) {	
	NumarkMixTrackQuad.jogled[deck-1] = NumarkMixTrackQuad.jogled[deck-1] + NumarkMixTrackQuad.reverse[deck-1]
	if (NumarkMixTrackQuad.jogled[deck-1] > 12.99) {
		NumarkMixTrackQuad.jogled[deck-1] = 1;
	} else if (NumarkMixTrackQuad.jogled[deck-1] < 1) {
		NumarkMixTrackQuad.jogled[deck-1] = 12.99;
	}
	NumarkMixTrackQuad.flashOnceOn(deck, group)
}

NumarkMixTrackQuad.playbutton = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = 0;
	if (!value) return;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = 0;
	NumarkMixTrackQuad.jogled[deck-1] = 1;
	if (engine.getValue(group, "play")) {
		engine.setValue(group, "play", 0);
		NumarkMixTrackQuad.channel[deck-1] = 0;
		midi.sendShortMsg(0xB0+(channel), 0x3C, 0);
	}else{
		engine.setValue(group, "play", 1);
		NumarkMixTrackQuad.channel[deck-1] = channel;
		NumarkMixTrackQuad.reverse[deck-1] = 1;
		NumarkMixTrackQuad.flashOnceOn(deck, group);
	}
}

NumarkMixTrackQuad.reversebutton = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = 0;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if (engine.getValue(group, "play")) {
		if (engine.getValue(group, "reverse")) {
			engine.setValue(group, "reverse", 0);
			NumarkMixTrackQuad.reverse[deck-1] = 1;
		}else{
			engine.setValue(group, "reverse", 1);
			NumarkMixTrackQuad.reverse[deck-1] = -1;
		}
	}else{
		if (engine.getValue(group, "reverse"), 1) {
			engine.setValue(group, "reverse", 0);
		}
	}
}

NumarkMixTrackQuad.cuebutton = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = 0;
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
	NumarkMixTrackQuad.untouched = 0;
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
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
		} 

	} else { 
	
		if (!NumarkMixTrackQuad.touch[deck-1]){
			if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
		}
	}

	engine.scratchTick(deck, adjustedJog);

	if (engine.getValue(group,"play")) {
		var gammaInputRange = 13;	// Max jog speed
		var maxOutFraction = 0.8;	// Where on the curve it should peak; 0.5 is half-way
		var sensitivity = 0.5;		// Adjustment gamma
		var gammaOutputRange = 2;	// Max rate change
		if (engine.getValue(group,"reverse") == 0) {
			adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity);   // Clockwise
		} else {
			adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity) * -1;	// Counter-clockwise
		}
		engine.setValue(group, "jog", adjustedJog);
		if (NumarkMixTrackQuad.isKeyLocked[deck-1] == 0){
			NumarkMixTrackQuad.reverse[deck-1] = 0;
		}
		if ((NumarkMixTrackQuad.scratchMode[deck-1] == 1) && (NumarkMixTrackQuad.touch[deck-1] == 1)) { 
			engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
			if (posNeg < 0) {	// Counter-clockwise
				NumarkMixTrackQuad.reverse[deck-1] = -0.30;
			} else {	// Clockwise
				NumarkMixTrackQuad.reverse[deck-1] = 0.30;
			}
		} else {		
				engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
				NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
				if ((posNeg < 0) && (engine.getValue(group,"reverse") == 0)) {	// Clockwise
					NumarkMixTrackQuad.reverse[deck-1] = 0.5;
				} else if (engine.getValue(group,"reverse") == 0) {
					NumarkMixTrackQuad.reverse[deck-1] = 1.25;
				} else if ((posNeg < 0) && (engine.getValue(group,"reverse") == 1)) {	// Counter-clockwise
					NumarkMixTrackQuad.reverse[deck-1] = -1.25;
				} else if (engine.getValue(group,"reverse") == 1) {
					NumarkMixTrackQuad.reverse[deck-1] = -0.5;
				}		
		}
		if (NumarkMixTrackQuad.touch[deck-1] == 0) {
			if (NumarkMixTrackQuad.scratchMode[deck-1] == 1) { 
			
			} else {
				engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
				NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
				if ((posNeg < 0) && (engine.getValue(group,"reverse") == 0)) {	// Clockwise
					NumarkMixTrackQuad.reverse[deck-1] = 0.5;
				} else if (engine.getValue(group,"reverse") == 0) {
					NumarkMixTrackQuad.reverse[deck-1] = 1.25;
				} else if ((posNeg < 0) && (engine.getValue(group,"reverse") == 1)) {	// Counter-clockwise
					NumarkMixTrackQuad.reverse[deck-1] = -1.25;
				} else if (engine.getValue(group,"reverse") == 1) {
					NumarkMixTrackQuad.reverse[deck-1] = -0.5;
				}						
			}
		}
	}
}

NumarkMixTrackQuad.jogWheelStopScratch = function(deck, group) {
	if (NumarkMixTrackQuad.touch[deck-1] == 0) {
		NumarkMixTrackQuad.scratchTimer[deck-1] = 1;
		if (engine.getValue(group,"reverse") == 1) {
			NumarkMixTrackQuad.reverse[deck-1] = -1;
		} else {
			NumarkMixTrackQuad.reverse[deck-1] = 1;
		}
	} else {
		NumarkMixTrackQuad.reverse[deck-1] = 0;
	}
}

NumarkMixTrackQuad.wheelTouch = function(channel, control, value, status, group){
	NumarkMixTrackQuad.untouched = 0;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if(!value){
		if (engine.getValue(group, "play", 1)) {
			
		}else{
			midi.sendShortMsg(0xB0+(channel), 0x3C, 0);
		}
		NumarkMixTrackQuad.touch[deck-1]= false;
		if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
		NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch(" + deck + ")", true);
		engine.scratchDisable(deck);
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
	NumarkMixTrackQuad.untouched = 0;
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

NumarkMixTrackQuad.lightShow = function() {
	if (NumarkMixTrackQuad.untouched == 1) {
		NumarkMixTrackQuad.shutdown()
		engine.beginTimer(60000, "NumarkMixTrackQuad.lightShow()", true);

		///---------- Animated Intro Turns On All LEDs ------------------>>
		
		//	COLORS
		//	1 0x01 RED
		//	2 0x02 ORANGE
		//	3 0x03 L ORANGE
		//	4 0x04 YELLOW
		//	5 0x05 GREEN
		//	6 0x06 L GREEN
		//	7 0x07 G BLUE
		//	8 0x08 L BLUE
		//	9 0x09 BLUE
		//	10 0x0A PURPLE
		//	11 0x0B PINK
		//	12 0x0C L RED
		//	13 0x0D L PINK
		//	14 0x0E L YELLOW
		//	15 0x0F PEACH
		//	16 0x10 L PEACH

		// Test colors here Deck 1 FX row pads
		//engine.beginTimer(4500, "midi.sendShortMsg(0x91, 0x59, 1)", true); 
		//engine.beginTimer(4500, "midi.sendShortMsg(0x91, 0x5A, 12)", true);
		//engine.beginTimer(4500, "midi.sendShortMsg(0x91, 0x5B, 11)", true);
		//engine.beginTimer(4500, "midi.sendShortMsg(0x91, 0x5C, 10)", true);
		
		// Animates jogWheel LEDs
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
		engine.beginTimer(1300, "midi.sendShortMsg(0xB1, 0x3D, 1)", true);
		engine.beginTimer(1400, "midi.sendShortMsg(0xB1, 0x3D, 2)", true);
		engine.beginTimer(1500, "midi.sendShortMsg(0xB1, 0x3D, 3)", true);
		engine.beginTimer(1600, "midi.sendShortMsg(0xB1, 0x3D, 4)", true);
		engine.beginTimer(1700, "midi.sendShortMsg(0xB1, 0x3D, 5)", true);
		engine.beginTimer(1800, "midi.sendShortMsg(0xB1, 0x3D, 6)", true);
		engine.beginTimer(1900, "midi.sendShortMsg(0xB1, 0x3C, 1)", true);
		engine.beginTimer(2000, "midi.sendShortMsg(0xB1, 0x3C, 2)", true);
		engine.beginTimer(3000, "midi.sendShortMsg(0xB1, 0x3C, 3)", true);
		engine.beginTimer(3100, "midi.sendShortMsg(0xB1, 0x3C, 4)", true);
		engine.beginTimer(3150, "midi.sendShortMsg(0xB1, 0x3C, 5)", true);
		engine.beginTimer(3200, "midi.sendShortMsg(0xB1, 0x3C, 6)", true);
		engine.beginTimer(3250, "midi.sendShortMsg(0xB1, 0x3C, 5)", true);
		engine.beginTimer(3300, "midi.sendShortMsg(0xB1, 0x3C, 4)", true);
		engine.beginTimer(3350, "midi.sendShortMsg(0xB1, 0x3C, 3)", true);
		engine.beginTimer(3400, "midi.sendShortMsg(0xB1, 0x3C, 2)", true);
		engine.beginTimer(3450, "midi.sendShortMsg(0xB1, 0x3C, 1)", true);
			
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
		engine.beginTimer(1300, "midi.sendShortMsg(0xB2, 0x3D, 12)", true);
		engine.beginTimer(1400, "midi.sendShortMsg(0xB2, 0x3D, 11)", true);
		engine.beginTimer(1500, "midi.sendShortMsg(0xB2, 0x3D, 10)", true);
		engine.beginTimer(1600, "midi.sendShortMsg(0xB2, 0x3D, 9)", true);
		engine.beginTimer(1700, "midi.sendShortMsg(0xB2, 0x3D, 8)", true);
		engine.beginTimer(1800, "midi.sendShortMsg(0xB2, 0x3D, 7)", true);
		engine.beginTimer(1900, "midi.sendShortMsg(0xB2, 0x3C, 1)", true);
		engine.beginTimer(2000, "midi.sendShortMsg(0xB2, 0x3C, 2)", true);
		engine.beginTimer(3000, "midi.sendShortMsg(0xB2, 0x3C, 3)", true);
		engine.beginTimer(3100, "midi.sendShortMsg(0xB2, 0x3C, 4)", true);
		engine.beginTimer(3150, "midi.sendShortMsg(0xB2, 0x3C, 5)", true);
		engine.beginTimer(3200, "midi.sendShortMsg(0xB2, 0x3C, 6)", true);
		engine.beginTimer(3250, "midi.sendShortMsg(0xB2, 0x3C, 5)", true);
		engine.beginTimer(3300, "midi.sendShortMsg(0xB2, 0x3C, 4)", true);
		engine.beginTimer(3350, "midi.sendShortMsg(0xB2, 0x3C, 3)", true);
		engine.beginTimer(3400, "midi.sendShortMsg(0xB2, 0x3C, 2)", true);
		engine.beginTimer(3450, "midi.sendShortMsg(0xB2, 0x3C, 1)", true);
		
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
		engine.beginTimer(1300, "midi.sendShortMsg(0xB3, 0x3D, 1)", true);
		engine.beginTimer(1400, "midi.sendShortMsg(0xB3, 0x3D, 2)", true);
		engine.beginTimer(1500, "midi.sendShortMsg(0xB3, 0x3D, 3)", true);
		engine.beginTimer(1600, "midi.sendShortMsg(0xB3, 0x3D, 4)", true);
		engine.beginTimer(1700, "midi.sendShortMsg(0xB3, 0x3D, 5)", true);
		engine.beginTimer(1800, "midi.sendShortMsg(0xB3, 0x3D, 6)", true);
		engine.beginTimer(1900, "midi.sendShortMsg(0xB3, 0x3C, 1)", true);
		engine.beginTimer(2000, "midi.sendShortMsg(0xB3, 0x3C, 2)", true);
		engine.beginTimer(3000, "midi.sendShortMsg(0xB3, 0x3C, 3)", true);
		engine.beginTimer(3100, "midi.sendShortMsg(0xB3, 0x3C, 4)", true);
		engine.beginTimer(3150, "midi.sendShortMsg(0xB3, 0x3C, 5)", true);
		engine.beginTimer(3200, "midi.sendShortMsg(0xB3, 0x3C, 6)", true);
		engine.beginTimer(3250, "midi.sendShortMsg(0xB3, 0x3C, 5)", true);
		engine.beginTimer(3300, "midi.sendShortMsg(0xB3, 0x3C, 4)", true);
		engine.beginTimer(3350, "midi.sendShortMsg(0xB3, 0x3C, 3)", true);
		engine.beginTimer(3400, "midi.sendShortMsg(0xB3, 0x3C, 2)", true);
		engine.beginTimer(3450, "midi.sendShortMsg(0xB3, 0x3C, 1)", true);
		
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
		engine.beginTimer(1300, "midi.sendShortMsg(0xB4, 0x3D, 12)", true);
		engine.beginTimer(1400, "midi.sendShortMsg(0xB4, 0x3D, 11)", true);
		engine.beginTimer(1500, "midi.sendShortMsg(0xB4, 0x3D, 10)", true);
		engine.beginTimer(1600, "midi.sendShortMsg(0xB4, 0x3D, 9)", true);
		engine.beginTimer(1700, "midi.sendShortMsg(0xB4, 0x3D, 8)", true);
		engine.beginTimer(1800, "midi.sendShortMsg(0xB4, 0x3D, 7)", true);
		engine.beginTimer(1900, "midi.sendShortMsg(0xB4, 0x3C, 1)", true);
		engine.beginTimer(2000, "midi.sendShortMsg(0xB4, 0x3C, 2)", true);
		engine.beginTimer(3000, "midi.sendShortMsg(0xB4, 0x3C, 3)", true);
		engine.beginTimer(3100, "midi.sendShortMsg(0xB4, 0x3C, 4)", true);
		engine.beginTimer(3150, "midi.sendShortMsg(0xB4, 0x3C, 5)", true);
		engine.beginTimer(3200, "midi.sendShortMsg(0xB4, 0x3C, 6)", true);
		engine.beginTimer(3250, "midi.sendShortMsg(0xB4, 0x3C, 5)", true);
		engine.beginTimer(3300, "midi.sendShortMsg(0xB4, 0x3C, 4)", true);
		engine.beginTimer(3350, "midi.sendShortMsg(0xB4, 0x3C, 3)", true);
		engine.beginTimer(3400, "midi.sendShortMsg(0xB4, 0x3C, 2)", true);
		engine.beginTimer(3450, "midi.sendShortMsg(0xB4, 0x3C, 1)", true);
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
		engine.beginTimer(1100, "FX1a", true); var cnt1 = 0; FX1a = function() { colorTimer1 = engine.beginTimer(100, "FX1a", true); cnt1 = cnt1 + 1; if (cnt1 > 16) { engine.stopTimer(colorTimer1); } midi.sendShortMsg(0x91, 0x59, cnt1);}
		engine.beginTimer(1400, "FX1b", true); var cnt2 = 0; FX1b = function() { colorTimer2 = engine.beginTimer(100, "FX1b", true); cnt2 = cnt2 + 1; if (cnt2 > 16) { engine.stopTimer(colorTimer2); } midi.sendShortMsg(0x92, 0x59, cnt2);}
		engine.beginTimer(1100, "FX1c", true); var cnt3 = 0; FX1c = function() { colorTimer3 = engine.beginTimer(100, "FX1c", true); cnt3 = cnt3 + 1; if (cnt3 > 16) { engine.stopTimer(colorTimer3); } midi.sendShortMsg(0x93, 0x59, cnt3);}
		engine.beginTimer(1400, "FX1d", true); var cnt4 = 0; FX1d = function() { colorTimer4 = engine.beginTimer(100, "FX1d", true); cnt4 = cnt4 + 1; if (cnt4 > 16) { engine.stopTimer(colorTimer4); } midi.sendShortMsg(0x94, 0x59, cnt4);}

		// Turns on FX2 LEDs
		engine.beginTimer(1200, "FX2a", true); var cnt5 = 0; FX2a = function() { colorTimer5 = engine.beginTimer(100, "FX2a", true); cnt5 = cnt5 + 1; if (cnt5 > 16) { engine.stopTimer(colorTimer5); } midi.sendShortMsg(0x91, 0x5A, cnt5);}
		engine.beginTimer(1300, "FX2b", true); var cnt6 = 0; FX2b = function() { colorTimer6 = engine.beginTimer(100, "FX2b", true); cnt6 = cnt6 + 1; if (cnt6 > 16) { engine.stopTimer(colorTimer6); } midi.sendShortMsg(0x92, 0x5A, cnt6);}
		engine.beginTimer(1200, "FX2c", true); var cnt7 = 0; FX2c = function() { colorTimer7 = engine.beginTimer(100, "FX2c", true); cnt7 = cnt7 + 1; if (cnt7 > 16) { engine.stopTimer(colorTimer7); } midi.sendShortMsg(0x93, 0x5A, cnt7);}
		engine.beginTimer(1300, "FX2d", true); var cnt8 = 0; FX2d = function() { colorTimer8 = engine.beginTimer(100, "FX2d", true); cnt8 = cnt8 + 1; if (cnt8 > 16) { engine.stopTimer(colorTimer8); } midi.sendShortMsg(0x94, 0x5A, cnt8);}

		// Turns on FX3 LEDs
		engine.beginTimer(1300, "FX3a", true); var cnt9 = 0; FX3a = function() { colorTimer9 = engine.beginTimer(100, "FX3a", true); cnt9 = cnt9 + 1; if (cnt9 > 16) { engine.stopTimer(colorTimer9); } midi.sendShortMsg(0x91, 0x5B, cnt9);}
		engine.beginTimer(1200, "FX3b", true); var cnt10 = 0; FX3b = function() { colorTimer10 = engine.beginTimer(100, "FX3b", true); cnt10 = cnt10 + 1; if (cnt10 > 16) { engine.stopTimer(colorTimer10); } midi.sendShortMsg(0x92, 0x5B, cnt10);}
		engine.beginTimer(1300, "FX3c", true); var cnt11 = 0; FX3c = function() { colorTimer11 = engine.beginTimer(100, "FX3c", true); cnt11 = cnt11 + 1; if (cnt11 > 16) { engine.stopTimer(colorTimer11); } midi.sendShortMsg(0x93, 0x5B, cnt11);}
		engine.beginTimer(1200, "FX3d", true); var cnt12 = 0; FX3d = function() { colorTimer12 = engine.beginTimer(100, "FX3d", true); cnt12 = cnt12 + 1; if (cnt12 > 16) { engine.stopTimer(colorTimer12); } midi.sendShortMsg(0x94, 0x5B, cnt12);}

		// Turns on Reset LEDs
		engine.beginTimer(1400, "RLEDsa", true); var cnt13 = 0; RLEDsa = function() { colorTimer13 = engine.beginTimer(100, "RLEDsa", true); cnt13 = cnt13 + 1; if (cnt13 > 16) { engine.stopTimer(colorTimer13); } midi.sendShortMsg(0x91, 0x5C, cnt13);}
		engine.beginTimer(1100, "RLEDsb", true); var cnt14 = 0; RLEDsb = function() { colorTimer14 = engine.beginTimer(100, "RLEDsb", true); cnt14 = cnt14 + 1; if (cnt14 > 16) { engine.stopTimer(colorTimer14); } midi.sendShortMsg(0x92, 0x5C, cnt14);}
		engine.beginTimer(1400, "RLEDsc", true); var cnt15 = 0; RLEDsc = function() { colorTimer15 = engine.beginTimer(100, "RLEDsc", true); cnt15 = cnt15 + 1; if (cnt15 > 16) { engine.stopTimer(colorTimer15); } midi.sendShortMsg(0x93, 0x5C, cnt15);}
		engine.beginTimer(1100, "RLEDsd", true); var cnt16 = 0; RLEDsd = function() { colorTimer16 = engine.beginTimer(100, "RLEDsd", true); cnt16 = cnt16 + 1; if (cnt16 > 16) { engine.stopTimer(colorTimer16); } midi.sendShortMsg(0x94, 0x5C, cnt16);}

		// Turns on Loop_IN LEDs
		engine.beginTimer(1000, "LILEDsa", true); var cnt17 = 0; LILEDsa = function() { colorTimer17 = engine.beginTimer(100, "LILEDsa", true); cnt17 = cnt17 + 1; if (cnt17 > 16) { engine.stopTimer(colorTimer17); } midi.sendShortMsg(0x91, 0x53, cnt17);}
		engine.beginTimer(1300, "LILEDsb", true); var cnt18 = 0; LILEDsb = function() { colorTimer18 = engine.beginTimer(100, "LILEDsb", true); cnt18 = cnt18 + 1; if (cnt18 > 16) { engine.stopTimer(colorTimer18); } midi.sendShortMsg(0x92, 0x53, cnt18);}
		engine.beginTimer(1000, "LILEDsc", true); var cnt19 = 0; LILEDsc = function() { colorTimer19 = engine.beginTimer(100, "LILEDsc", true); cnt19 = cnt19 + 1; if (cnt19 > 16) { engine.stopTimer(colorTimer19); } midi.sendShortMsg(0x93, 0x53, cnt19);}
		engine.beginTimer(1300, "LILEDsd", true); var cnt20 = 0; LILEDsd = function() { colorTimer20 = engine.beginTimer(100, "LILEDsd", true); cnt20 = cnt20 + 1; if (cnt20 > 16) { engine.stopTimer(colorTimer20); } midi.sendShortMsg(0x94, 0x53, cnt20);}

		// Turns on Loop_OUT LEDs
		engine.beginTimer(1100, "LOLEDsa", true); var cnt21 = 0; LOLEDsa = function() { colorTimer21 = engine.beginTimer(100, "LOLEDsa", true); cnt21 = cnt21 + 1; if (cnt21 > 16) { engine.stopTimer(colorTimer21); } midi.sendShortMsg(0x91, 0x54, cnt21);}
		engine.beginTimer(1200, "LOLEDsb", true); var cnt22 = 0; LOLEDsb = function() { colorTimer22 = engine.beginTimer(100, "LOLEDsb", true); cnt22 = cnt22 + 1; if (cnt22 > 16) { engine.stopTimer(colorTimer22); } midi.sendShortMsg(0x92, 0x54, cnt22);}
		engine.beginTimer(1100, "LOLEDsc", true); var cnt23 = 0; LOLEDsc = function() { colorTimer23 = engine.beginTimer(100, "LOLEDsc", true); cnt23 = cnt23 + 1; if (cnt23 > 16) { engine.stopTimer(colorTimer23); } midi.sendShortMsg(0x93, 0x54, cnt23);}
		engine.beginTimer(1200, "LOLEDsd", true); var cnt24 = 0; LOLEDsd = function() { colorTimer24 = engine.beginTimer(100, "LOLEDsd", true); cnt24 = cnt24 + 1; if (cnt24 > 16) { engine.stopTimer(colorTimer24); } midi.sendShortMsg(0x94, 0x54, cnt24);}

		// Turns on Reloop LEDs
		engine.beginTimer(1200, "RLLEDsa", true); var cnt25 = 0; RLLEDsa = function() { colorTimer25 = engine.beginTimer(100, "RLLEDsa", true); cnt25 = cnt25 + 1; if (cnt25 > 16) { engine.stopTimer(colorTimer25); } midi.sendShortMsg(0x91, 0x55, cnt25);}
		engine.beginTimer(1100, "RLLEDsb", true); var cnt26 = 0; RLLEDsb = function() { colorTimer26 = engine.beginTimer(100, "RLLEDsb", true); cnt26 = cnt26 + 1; if (cnt26 > 16) { engine.stopTimer(colorTimer26); } midi.sendShortMsg(0x92, 0x55, cnt26);}
		engine.beginTimer(1200, "RLLEDsc", true); var cnt27 = 0; RLLEDsc = function() { colorTimer27 = engine.beginTimer(100, "RLLEDsc", true); cnt27 = cnt27 + 1; if (cnt27 > 16) { engine.stopTimer(colorTimer27); } midi.sendShortMsg(0x93, 0x55, cnt27);}
		engine.beginTimer(1100, "RLLEDsd", true); var cnt28 = 0; RLLEDsd = function() { colorTimer28 = engine.beginTimer(100, "RLLEDsd", true); cnt28 = cnt28 + 1; if (cnt28 > 16) { engine.stopTimer(colorTimer28); } midi.sendShortMsg(0x94, 0x55, cnt28);}

		// Turns on Loop_Size LEDs
		engine.beginTimer(1300, "LSLEDsa", true); var cnt29 = 0; LSLEDsa = function() { colorTimer29 = engine.beginTimer(100, "LSLEDsa", true); cnt29 = cnt29 + 1; if (cnt29 > 16) { engine.stopTimer(colorTimer29); } midi.sendShortMsg(0x91, 0x63, cnt29);}
		engine.beginTimer(1000, "LSLEDsb", true); var cnt30 = 0; LSLEDsb = function() { colorTimer30 = engine.beginTimer(100, "LSLEDsb", true); cnt30 = cnt30 + 1; if (cnt30 > 16) { engine.stopTimer(colorTimer30); } midi.sendShortMsg(0x92, 0x63, cnt30);}
		engine.beginTimer(1300, "LSLEDsc", true); var cnt31 = 0; LSLEDsc = function() { colorTimer31 = engine.beginTimer(100, "LSLEDsc", true); cnt31 = cnt31 + 1; if (cnt31 > 16) { engine.stopTimer(colorTimer31); } midi.sendShortMsg(0x93, 0x63, cnt31);}
		engine.beginTimer(1000, "LSLEDsd", true); var cnt32 = 0; LSLEDsd = function() { colorTimer32 = engine.beginTimer(100, "LSLEDsd", true); cnt32 = cnt32 + 1; if (cnt32 > 16) { engine.stopTimer(colorTimer32); } midi.sendShortMsg(0x94, 0x63, cnt32);}
		
		// Turns on Folder/File LEDs
		engine.beginTimer(3100, "midi.sendShortMsg(0x90, 0x4B, 1)", true);
		engine.beginTimer(3100, "midi.sendShortMsg(0x90, 0x4C, 1)", true);
		
		//---------------- Turns off unused LEDs ----------------------->>
		
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
		
		//----------- Sets LEDs to startup colors ----------------------->>
		
		// Sets FX1 LEDs to match .xml
		engine.beginTimer(4100, "midi.sendShortMsg(0x91, 0x59, 9)", true);
		engine.beginTimer(4100, "midi.sendShortMsg(0x92, 0x59, 9)", true);
		engine.beginTimer(4100, "midi.sendShortMsg(0x93, 0x59, 9)", true);
		engine.beginTimer(4100, "midi.sendShortMsg(0x94, 0x59, 9)", true);
		
		// Sets FX2 LEDs to match .xml
		engine.beginTimer(4200, "midi.sendShortMsg(0x91, 0x5A, 9)", true);
		engine.beginTimer(4200, "midi.sendShortMsg(0x92, 0x5A, 9)", true);
		engine.beginTimer(4200, "midi.sendShortMsg(0x93, 0x5A, 9)", true);
		engine.beginTimer(4200, "midi.sendShortMsg(0x94, 0x5A, 9)", true);
		
		// Sets FX3 LEDs to match .xml
		engine.beginTimer(4300, "midi.sendShortMsg(0x91, 0x5B, 9)", true);
		engine.beginTimer(4300, "midi.sendShortMsg(0x92, 0x5B, 9)", true);
		engine.beginTimer(4300, "midi.sendShortMsg(0x93, 0x5B, 9)", true);
		engine.beginTimer(4300, "midi.sendShortMsg(0x94, 0x5B, 9)", true);
		
		// Sets Reset LEDs to match .xml
		engine.beginTimer(4400, "midi.sendShortMsg(0x91, 0x5C, 5)", true);
		engine.beginTimer(4400, "midi.sendShortMsg(0x92, 0x5C, 5)", true);
		engine.beginTimer(4400, "midi.sendShortMsg(0x93, 0x5C, 8)", true);
		engine.beginTimer(4400, "midi.sendShortMsg(0x94, 0x5C, 8)", true);
		
		// Sets Loop_IN LEDs to match .xml
		engine.beginTimer(4500, "midi.sendShortMsg(0x91, 0x53, 7)", true);
		engine.beginTimer(4500, "midi.sendShortMsg(0x92, 0x53, 7)", true);
		engine.beginTimer(4500, "midi.sendShortMsg(0x93, 0x53, 7)", true);
		engine.beginTimer(4500, "midi.sendShortMsg(0x94, 0x53, 7)", true);
		
		// Sets Loop_OUT LEDs to match .xml
		engine.beginTimer(4600, "midi.sendShortMsg(0x91, 0x54, 7)", true);
		engine.beginTimer(4600, "midi.sendShortMsg(0x92, 0x54, 7)", true);
		engine.beginTimer(4600, "midi.sendShortMsg(0x93, 0x54, 7)", true);
		engine.beginTimer(4600, "midi.sendShortMsg(0x94, 0x54, 7)", true);
		
		// Sets Reloop LEDs to match .xml
		engine.beginTimer(4700, "midi.sendShortMsg(0x91, 0x55, 11)", true);
		engine.beginTimer(4700, "midi.sendShortMsg(0x92, 0x55, 11)", true);
		engine.beginTimer(4700, "midi.sendShortMsg(0x93, 0x55, 11)", true);
		engine.beginTimer(4700, "midi.sendShortMsg(0x94, 0x55, 11)", true);
		
		// Sets Loop_Size LEDs to match .xml
		engine.beginTimer(4800, "midi.sendShortMsg(0x91, 0x63, 10)", true);
		engine.beginTimer(4800, "midi.sendShortMsg(0x92, 0x63, 10)", true);
		engine.beginTimer(4800, "midi.sendShortMsg(0x93, 0x63, 10)", true);
		engine.beginTimer(4800, "midi.sendShortMsg(0x94, 0x63, 10)", true);
		
		// Sets Folder/File LEDs to match Mixxx app
		engine.beginTimer(4900, "midi.sendShortMsg(0x90, 0x4B, 0)", true);
		engine.beginTimer(4900, "midi.sendShortMsg(0x90, 0x4C, 1)", true);
	}
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