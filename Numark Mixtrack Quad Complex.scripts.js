//- Numark Mixtrack Quad 4 Deck Mapping and Script for Mixxx 2.3.3 Complex By DJ KWKSND
//- Based on Mixxx default controller settings, Numark Mixtrack Mapping, and Numark Mixtrack Pro Script
//-
//- 1/11/2010 - v0.1 - Matteo <matteo@magm3.com>
//- 5/18/2011 - Changed by James Ralston
//- 05/26/2012 to 06/27/2012 - Changed by Darío José Freije <dario2004@gmail.com>
//- 30/10/2014 Einar Alex - einar@gmail.com
//- 08/14/2021-08/17/2021 - Edited by datlaunchystark (DJ LaunchStar) and added 4 deck support/LEDs... yeah
//- 06/23/2022 by datlaunchystark on Mixxx 2.3.3 (mostly cleaned up code) https://github.com/datlaunchystark
//- For the original code and the idea to get this controller functional in Mixxx. You guys are awesome! :)
//-
//- Updated on 12/6/2022 by DJ KWKSND (changed a bunch of code and mappings)
//- https://github.com/KWKSND/Numark-Mixtrack-Quad-4-Deck-mapping-for-Mixxx-2.3.3
//- I agree with the above statement
//- You guys drove my O.C.D. crazy enough to get it done for everyone thanks for the inspiration
//- I had not worked with midi or javascript, still more done in the last week or so than all you in 12 years ROFL
//- I hope many people get to enjoy this wonderful controller for years to come without being robbed by VDJ
//-
//- Whats new?
//-  There is now 2 versions of this script, Basic (the old easy controls), and Complex (as the manual describes)
//-  Incorrectly mapped buttons were found and fixed
//-  FX123 & Filter knob speed is fixed
//-  Pressing shift + turning FX123 knobs now change what effects are assigned to the pads
//-  Pressing shift + turning FXF knobs now mix the dry / wet level of the FX123 unit
//-  Pressing shift + keylock now enables / disables keylock
//-  Pressing shift + keylock while in scratch mode now enables / disables slip mode
//-  Pressing shift + range now scales the range of the pitch slider
//-  Pressing shift + delete now deletes the hot cues
//-  Pressing left shift + right shift now enables / disables AutoDJ (option, preference, AutoDJ, add random tracks)
//-  AutoDJ now auto enabled with nice slow fade in when Mixxx starts so you can start Mixxx and walk away
//-  Soft takeover added to all sliders and knobs, so there is no more extreme jumps in volumes or filters etc
//-  Jogwheel direction when not in scratch mode was wrong now fixed
//-  Fixed some timer kill errors
//-  New colors on most pads
//-  Hot cue LEDs now match the colors in the app (IMPORTANT use Recordbox hot cue colors to match this script)
//-  Beautiful LED intro on Mixxx startup
//-  Idle mode added to keep the LED show going until you start DJing, also now resumes if idle again
//-  Improved controls and LED animation with scratching especially in reverse
//-  LEDs now work with scratching and stop with end of track
//-  Added master clipping indicators to the folder / file LEDs to keep you from blowing your shit up
//-  Added channel clipping indicators to the headphone LEDs for each channel to prevent overdoing it on the EQ
//-  Shutdown function added to turn off all possible LEDs with Mixxx app shutdown
//-  Stutter flashes the BPM and Cue flashes to indicate 30 seconds from end of track
//-  And finally i get to announce all jogwheel LEDs now work without having to press play on the controller :D
//-  Hit play on the controller, or with the mouse on the Mixxx app, or let AutoDJ do it for you it all works YES!!!
//-
//- Features:
//-  Supports 4 decks
//-  Library browse knob + load A/B
//-  Channel volume, cross fader, cue gain / mix, master gain, filters, pitch and pitch bend
//-  Scratch / CD mode toggle
//-  Headphone output toggle
//-  Samples (Using 16 samples)
//-  Effects (Using 4 effect units)
//-  Cue 1-4 adds hot cues from play position
//-  Loops:
//-   Loop in 	(anywhere)
//-   Loop out 	(anywhere)
//-   Re-loop 	(reloop from cue point, press again to exit loop)
//-   Loop half (1/2 the loop, shift + 1/2 = X2 the loop)
//-
//- Known feature with all midi devices:
//-  Each slide / knob needs to be moved on Mixxx startup to match levels with the Mixxx UI

function NumarkMixTrackQuad() {}

NumarkMixTrackQuad.init = function(id) {
	NumarkMixTrackQuad.id = id;
	NumarkMixTrackQuad.directoryMode = false;
	NumarkMixTrackQuad.scratchMode = [false, false];
	NumarkMixTrackQuad.touch = [false, false];
	NumarkMixTrackQuad.scratchTimer = [-1, -1];
	NumarkMixTrackQuad.isKeyLocked = [0, 0];
	NumarkMixTrackQuad.jogled = [1];
	NumarkMixTrackQuad.reverse = [1];
	NumarkMixTrackQuad.flashOnceTimer = [0];
	NumarkMixTrackQuad.channel = [0];	
	NumarkMixTrackQuad.untouched = 0;
	NumarkMixTrackQuad.interuptLEDShow = 0;
	NumarkMixTrackQuad.peakLEDShow = 0;
	NumarkMixTrackQuad.flasher1 = 1;
	NumarkMixTrackQuad.flasher2 = 1;
	NumarkMixTrackQuad.flasher3 = 1;
	NumarkMixTrackQuad.flasher4 = 1;
	SHFTD1 = 0;
	SHFTD2 = 0;
	SHFTD3 = 0;
	SHFTD4 = 0;
	
	NumarkMixTrackQuad.leds = [
		{ "directory": 0x4B, "file": 0x4C },
	];
	
	engine.setValue('[Master]', 'volume', 0)
	engine.beginTimer(20, "NumarkMixTrackQuad.shutdown()", true);
	engine.beginTimer(200, "NumarkMixTrackQuad.peakIndicator()", false);
	engine.beginTimer(300, "NumarkMixTrackQuad.lightShow ()" , true);
	engine.beginTimer(11000, "NumarkMixTrackQuad.autoDjLedFix('[Channel1]') ", true);
	engine.beginTimer(11100, "NumarkMixTrackQuad.autoDjLedFix('[Channel2]') ", true);
	engine.beginTimer(11200, "NumarkMixTrackQuad.autoDjLedFix('[Channel3]') ", true);
	engine.beginTimer(11300, "NumarkMixTrackQuad.autoDjLedFix('[Channel4]') ", true);
	engine.beginTimer(18000, "engine.setValue('[Library]', 'MoveDown', 1)", true);
	engine.beginTimer(19000, "engine.setValue('[AutoDJ]', 'enabled', 1)", true);
	NumarkMixTrackQuad.volUpTimer = engine.beginTimer(20000, "MVolUp", true); var volCnt = 0; MVolUp = function() { NumarkMixTrackQuad.volUpTimer = engine.beginTimer(250, "MVolUp", true); volCnt = volCnt + 0.01; if (volCnt > 1) { engine.stopTimer(NumarkMixTrackQuad.volUpTimer); } engine.setValue('[Master]', 'volume', volCnt);}

	engine.connectControl("[Channel1]","beat_active","NumarkMixTrackQuad.sync1Led");
	engine.connectControl("[Channel2]","beat_active","NumarkMixTrackQuad.sync2Led");
	engine.connectControl("[Channel3]","beat_active","NumarkMixTrackQuad.sync3Led");
	engine.connectControl("[Channel4]","beat_active","NumarkMixTrackQuad.sync4Led");
	
    NumarkMixTrackQuad.activeButtonsR1 = NumarkMixTrackQuad.unshiftedButtonsR1;
    NumarkMixTrackQuad.activeButtonsR2 = NumarkMixTrackQuad.unshiftedButtonsR2;
    NumarkMixTrackQuad.activeButtonsR3 = NumarkMixTrackQuad.unshiftedButtonsR3;
    NumarkMixTrackQuad.activeButtonsR4 = NumarkMixTrackQuad.unshiftedButtonsR4;
}

NumarkMixTrackQuad.gain = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = -1;
	var curgain = engine.getValue(group, "volume");
	if (value < 64) {
		multiplier = 0.015625 * value ;
		if (curgain - multiplier <= 0.15 && curgain - multiplier >= -0.15) {
			engine.setValue(group, "volume", multiplier);
		}
	} else { 
		multiplier = (0.0625 * (value-64)) + 1;
		if (curgain - multiplier <= 0.75 && curgain - multiplier >= -0.75) {
			engine.setValue(group, "volume", multiplier);
		}
	}
	if (NumarkMixTrackQuad.volUpTimer) {engine.stopTimer(NumarkMixTrackQuad.volUpTimer); NumarkMixTrackQuad.volUpTimer = 0};
}

NumarkMixTrackQuad.autoDjLedFix = function(group) {
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if (group == '[Channel1]') {
		NumarkMixTrackQuad.channel[deck-1] = 1;
	}
	if (group == '[Channel2]') {
		NumarkMixTrackQuad.channel[deck-1] = 2;
	}
	if (group == '[Channel3]') {
		NumarkMixTrackQuad.channel[deck-1] = 3;
	}
	if (group == '[Channel4]') {
		NumarkMixTrackQuad.channel[deck-1] = 4;
	}
	if (!NumarkMixTrackQuad.jogled[deck-1]) {NumarkMixTrackQuad.jogled[deck-1] = 1;}
	NumarkMixTrackQuad.reverse[deck-1] = 1;
	NumarkMixTrackQuad.flashOnceTimer[deck-1] = engine.beginTimer(50, "NumarkMixTrackQuad.flashOnceOn('" + deck + "', '" + group + "')", false); // make this timer shorter if you want faster LEDs on jogwheels
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
	NumarkMixTrackQuad.untouched = -3;
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
	if (NumarkMixTrackQuad.interuptLEDShow == 1)  {
		if (engine.getValue(group, "play", 1) || NumarkMixTrackQuad.touch[deck-1] == 1 ){
			midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3D, NumarkMixTrackQuad.jogled[deck-1]);
		}else{
			midi.sendShortMsg(0xB0+(NumarkMixTrackQuad.channel[deck-1]), 0x3C, 0);
		}
	}
	NumarkMixTrackQuad.jogled[deck-1] = NumarkMixTrackQuad.jogled[deck-1] + NumarkMixTrackQuad.reverse[deck-1]
	if (NumarkMixTrackQuad.jogled[deck-1] > 12.99) {
		NumarkMixTrackQuad.jogled[deck-1] = 1;
	} else if (NumarkMixTrackQuad.jogled[deck-1] < 1) {
		NumarkMixTrackQuad.jogled[deck-1] = 12.99;
	}
}

NumarkMixTrackQuad.playbutton = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = -3;
	if (!value) return;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if (!NumarkMixTrackQuad.jogled[deck-1]) {NumarkMixTrackQuad.jogled[deck-1] = 1;}
	if (engine.getValue(group, "play")) {
		engine.setValue(group, "play", 0);
	}else{
		engine.setValue(group, "play", 1);
		NumarkMixTrackQuad.channel[deck-1] = channel;
		NumarkMixTrackQuad.reverse[deck-1] = 1;
	}
	NumarkMixTrackQuad.restoreCULEDsState()
	NumarkMixTrackQuad.restorePLEDsState()
}

NumarkMixTrackQuad.reversebutton = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = -3;
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
	NumarkMixTrackQuad.untouched = -3;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if (engine.getValue(group, "playposition") <= 0.97) {
			engine.setValue(group, "cue_default", value ? 1 : 0);
		if (engine.getValue(group, "reverse")) {
			engine.setValue(group, "reverse", 1);
		}
	} else {
		engine.setValue(group, "cue_preview", value ? 1 : 0);
	}
}

NumarkMixTrackQuad.jogWheel = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = -3;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	var adjustedJog = parseFloat(value);
	var posNeg = 1;
	if (adjustedJog > 63) {
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
		var gammaInputRange = 13;
		var maxOutFraction = 0.8;
		var sensitivity = 0.5;
		var gammaOutputRange = 2;
		if (engine.getValue(group, "reverse"), 0) {
			adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity);
		} else {
			adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity) * -1;
		}
		engine.setValue(group, "jog", adjustedJog);
		if (NumarkMixTrackQuad.isKeyLocked[deck-1] == 0){
			NumarkMixTrackQuad.reverse[deck-1] = 0;
		}
		if ((NumarkMixTrackQuad.scratchMode[deck-1] == 1) && (NumarkMixTrackQuad.touch[deck-1] == 1)) { 
			if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
			if (posNeg < 0) {
				NumarkMixTrackQuad.reverse[deck-1] = -0.40;
			} else {
				NumarkMixTrackQuad.reverse[deck-1] = 0.40;
			}
		} else {
			if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
			NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
			if ((posNeg < 0) && (engine.getValue(group, "reverse"), 0)) {
				NumarkMixTrackQuad.reverse[deck-1] = -0.5;
			} else if (engine.getValue(group, "reverse"), 0) {
				NumarkMixTrackQuad.reverse[deck-1] = -1.15;
			} else if ((posNeg > 0) && (engine.getValue(group, "reverse"), 1)) {
				NumarkMixTrackQuad.reverse[deck-1] = 1.15;
			} else if (engine.getValue(group, "reverse"), 1) {
				NumarkMixTrackQuad.reverse[deck-1] = 0.5;
			}		
		}
		if (NumarkMixTrackQuad.touch[deck-1] == 0) {
			if (NumarkMixTrackQuad.scratchMode[deck-1] == 1) { 
			
			} else {
				if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
				NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
				if ((posNeg < 0) && (engine.getValue(group, "reverse"), 0)) {
					NumarkMixTrackQuad.reverse[deck-1] = -0.5;
				} else if (engine.getValue(group, "reverse"), 0) {
					NumarkMixTrackQuad.reverse[deck-1] = -1.15;
				} else if ((posNeg > 0) && (engine.getValue(group, "reverse"), 1)) {
					NumarkMixTrackQuad.reverse[deck-1] = 1.15;
				} else if (engine.getValue(group, "reverse"), 1) {
					NumarkMixTrackQuad.reverse[deck-1] = 0.5;
				}						
			}
		}
		engine.setValue(group, "jog", adjustedJog*-1);	
	} else {
		if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
		NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch('" + deck + "', '" + group + "')", true);
		if ((posNeg < 0)) {
			NumarkMixTrackQuad.reverse[deck-1] = -0.5;
		} else if ((posNeg > 0)) {
			NumarkMixTrackQuad.reverse[deck-1] = 0.5;
		}						
	}
}

NumarkMixTrackQuad.jogWheelStopScratch = function(deck, group) {
	if (NumarkMixTrackQuad.touch[deck-1] == 0) {
		NumarkMixTrackQuad.scratchTimer[deck-1] = 1;
		if (NumarkMixTrackQuad.scratchMode[deck-1]) {
			if (engine.getValue(group,"slip_enabled")) {
				engine.setValue(group,"slip_enabled",0);
				engine.beginTimer(1000, "engine.setValue('" + group + "','slip_enabled',1)", true);
			}
		}
		if (engine.getValue(group, "reverse"), 1) {
			NumarkMixTrackQuad.reverse[deck-1] = 1;
		} else {
			NumarkMixTrackQuad.reverse[deck-1] = -1;
		}
	} else {
		NumarkMixTrackQuad.reverse[deck-1] = 0;
	}
}

NumarkMixTrackQuad.wheelTouch = function(channel, control, value, status, group){
	NumarkMixTrackQuad.untouched = -3;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
	if(!value){
		NumarkMixTrackQuad.touch[deck-1]= false;
		if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
		NumarkMixTrackQuad.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackQuad.jogWheelStopScratch(" + deck + ")", true);
		engine.scratchDisable(deck);
	} else {
		if (!NumarkMixTrackQuad.scratchMode[deck-1] && engine.getValue(group, "play")) return;

		NumarkMixTrackQuad.isKeyLocked[deck-1] = engine.getValue(group, "keylock");
		if (NumarkMixTrackQuad.isKeyLocked[deck-1]){
			engine.setValue(group, "keylock", 0);
		}
		if (NumarkMixTrackQuad.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackQuad.scratchTimer[deck-1]);
		engine.scratchEnable(deck, 600, 33+1/3, 1.0/8, (1.0/8)/32);
		NumarkMixTrackQuad.touch[deck-1]= true;
	}
}

NumarkMixTrackQuad.toggleDirectoryMode = function(channel, control, value, status, group) {
	if (value) {
		NumarkMixTrackQuad.directoryMode = !NumarkMixTrackQuad.directoryMode;
		NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["directory"], NumarkMixTrackQuad.directoryMode);
		NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["file"], !NumarkMixTrackQuad.directoryMode);
	}
}

NumarkMixTrackQuad.toggleScratchMode = function(channel, control, value, status, group) {
	NumarkMixTrackQuad.untouched = -3;
	if (!value) return;
	var deck = NumarkMixTrackQuad.groupToDeck(group);
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
	NumarkMixTrackQuad.untouched = (NumarkMixTrackQuad.untouched + 1);
	engine.beginTimer(60000, "NumarkMixTrackQuad.lightShow()", true);
	if (NumarkMixTrackQuad.untouched >= 1) {
		NumarkMixTrackQuad.shutdown()

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
		NumarkMixTrackQuad.interuptLEDShow = [0];
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
		engine.beginTimer(3000, "midi.sendShortMsg(0x90, 0x4B, 1)", true);
		engine.beginTimer(3000, "midi.sendShortMsg(0x90, 0x4C, 1)", true);
		
		//---------------- Turns off unused LEDs ----------------------->>
		
		// Turns off jogWheel LEDs
		engine.beginTimer(3500, "midi.sendShortMsg(0xB1, 0x3C, 0)", true);
		engine.beginTimer(3500, "midi.sendShortMsg(0xB2, 0x3C, 0)", true);
		engine.beginTimer(3500, "midi.sendShortMsg(0xB3, 0x3C, 0)", true);
		engine.beginTimer(3500, "midi.sendShortMsg(0xB4, 0x3C, 0)", true);
				
		// Turns off Stutter LEDs
		engine.beginTimer(4100, "midi.sendShortMsg(0x91, 0x4A, 0)", true);
		engine.beginTimer(4100, "midi.sendShortMsg(0x92, 0x4A, 0)", true);
		engine.beginTimer(4100, "midi.sendShortMsg(0x93, 0x4A, 0)", true);
		engine.beginTimer(4100, "midi.sendShortMsg(0x94, 0x4A, 0)", true);
		
		//----------- Sets LEDs to match colors ----------------------->>
		
		// Sets State off Headphone LEDs to match app
		engine.beginTimer(3700, "NumarkMixTrackQuad.restoreHPLEDsState()", true);
		
		// Sets State off Sync LEDs to match app
		engine.beginTimer(3900, "NumarkMixTrackQuad.restoreSYLEDsState()", true);
		
		// Sets State off Scratch LEDs to match app
		engine.beginTimer(3600, "midi.sendShortMsg(0x91, 0x48, 0)", true);
		engine.beginTimer(3600, "midi.sendShortMsg(0x92, 0x48, 0)", true);
		engine.beginTimer(3600, "midi.sendShortMsg(0x93, 0x48, 0)", true);
		engine.beginTimer(3600, "midi.sendShortMsg(0x94, 0x48, 0)", true);
			
		// Sets Cue LEDs to match app
		engine.beginTimer(3900, "NumarkMixTrackQuad.restoreCULEDsState()", true);

		// Sets Play/Pause LEDs to match app
		engine.beginTimer(4000, "NumarkMixTrackQuad.restorePLEDsState()", true);
		
		// Sets FX1 LEDs to match app
		engine.beginTimer(4200, "NumarkMixTrackQuad.restoreFX1LEDsState()", true);

		// Sets FX2 LEDs to match .xml
		engine.beginTimer(4300, "NumarkMixTrackQuad.restoreFX2LEDsState()", true);
		
		// Sets FX3 LEDs to match .xml
		engine.beginTimer(4400, "NumarkMixTrackQuad.restoreFX3LEDsState()", true);
		
		// Sets Reset LEDs to match .xml
		engine.beginTimer(4500, "NumarkMixTrackQuad.restoreFXRLEDsState()", true);
		
		// Sets Loop_IN LEDs to match .xml
		engine.beginTimer(4600, "midi.sendShortMsg(0x91, 0x53, 7)", true);
		engine.beginTimer(4600, "midi.sendShortMsg(0x92, 0x53, 7)", true);
		engine.beginTimer(4600, "midi.sendShortMsg(0x93, 0x53, 7)", true);
		engine.beginTimer(4600, "midi.sendShortMsg(0x94, 0x53, 7)", true);
		
		// Sets Loop_OUT LEDs to match .xml
		engine.beginTimer(4700, "midi.sendShortMsg(0x91, 0x54, 7)", true);
		engine.beginTimer(4700, "midi.sendShortMsg(0x92, 0x54, 7)", true);
		engine.beginTimer(4700, "midi.sendShortMsg(0x93, 0x54, 7)", true);
		engine.beginTimer(4700, "midi.sendShortMsg(0x94, 0x54, 7)", true);
		
		// Sets Reloop LEDs to match .xml
		engine.beginTimer(4800, "midi.sendShortMsg(0x91, 0x55, 11)", true);
		engine.beginTimer(4800, "midi.sendShortMsg(0x92, 0x55, 11)", true);
		engine.beginTimer(4800, "midi.sendShortMsg(0x93, 0x55, 11)", true);
		engine.beginTimer(4800, "midi.sendShortMsg(0x94, 0x55, 11)", true);
		
		// Sets Loop_Size LEDs to match .xml
		engine.beginTimer(4900, "midi.sendShortMsg(0x91, 0x63, 10)", true);
		engine.beginTimer(4900, "midi.sendShortMsg(0x92, 0x63, 10)", true);
		engine.beginTimer(4900, "midi.sendShortMsg(0x93, 0x63, 10)", true);
		engine.beginTimer(4900, "midi.sendShortMsg(0x94, 0x63, 10)", true);
		
		// Sets Folder/File LEDs to match Mixxx app
		engine.beginTimer(5000, "NumarkMixTrackQuad.restoreDRLEDsState()", true);
		engine.beginTimer(5000, "NumarkMixTrackQuad.interuptLEDShow = 1", true);
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

NumarkMixTrackQuad.restoreFX1LEDsState = function(){
	var stateFX11 = engine.getValue('[EffectRack1_EffectUnit1_Effect1]', "enabled");
	var stateFX12 = engine.getValue('[EffectRack1_EffectUnit2_Effect1]', "enabled");
	var stateFX13 = engine.getValue('[EffectRack1_EffectUnit3_Effect1]', "enabled");
	var stateFX14 = engine.getValue('[EffectRack1_EffectUnit4_Effect1]', "enabled");
	if (stateFX11) { 
		midi.sendShortMsg(0x91, 0x59, 5); // match to .xml vvv
	} else {
		midi.sendShortMsg(0x91, 0x59, 9);
	}
	if (stateFX12) { 
		midi.sendShortMsg(0x92, 0x59, 5);
	} else {
		midi.sendShortMsg(0x92, 0x59, 9);
	}
	if (stateFX13) { 
		midi.sendShortMsg(0x93, 0x59, 8);
	} else {
		midi.sendShortMsg(0x93, 0x59, 9);
	}
	if (stateFX14) { 
		midi.sendShortMsg(0x94, 0x59, 8);
	} else {
		midi.sendShortMsg(0x94, 0x59, 9);
	}
}

NumarkMixTrackQuad.restoreFX2LEDsState = function(){
	var stateFX21 = engine.getValue('[EffectRack1_EffectUnit1_Effect2]', "enabled");
	var stateFX22 = engine.getValue('[EffectRack1_EffectUnit2_Effect2]', "enabled");
	var stateFX23 = engine.getValue('[EffectRack1_EffectUnit3_Effect2]', "enabled");
	var stateFX24 = engine.getValue('[EffectRack1_EffectUnit4_Effect2]', "enabled");
	if (stateFX21) { 
		midi.sendShortMsg(0x91, 0x5A, 5); // match to .xml vvv
	} else {
		midi.sendShortMsg(0x91, 0x5A, 9);
	}
	if (stateFX22) { 
		midi.sendShortMsg(0x92, 0x5A, 5);
	} else {
		midi.sendShortMsg(0x92, 0x5A, 9);
	}
	if (stateFX23) { 
		midi.sendShortMsg(0x93, 0x5A, 8);
	} else {
		midi.sendShortMsg(0x93, 0x5A, 9);
	}
	if (stateFX24) { 
		midi.sendShortMsg(0x94, 0x5A, 8);
	} else {
		midi.sendShortMsg(0x94, 0x5A, 9);
	}
}

NumarkMixTrackQuad.restoreFX3LEDsState = function(){
	var stateFX31 = engine.getValue('[EffectRack1_EffectUnit1_Effect3]', "enabled");
	var stateFX32 = engine.getValue('[EffectRack1_EffectUnit2_Effect3]', "enabled");
	var stateFX33 = engine.getValue('[EffectRack1_EffectUnit3_Effect3]', "enabled");
	var stateFX34 = engine.getValue('[EffectRack1_EffectUnit4_Effect3]', "enabled");
	if (stateFX31) { 
		midi.sendShortMsg(0x91, 0x5B, 5); // match to .xml vvv
	} else {
		midi.sendShortMsg(0x91, 0x5B, 9);
	}
	if (stateFX32) { 
		midi.sendShortMsg(0x92, 0x5B, 5);
	} else {
		midi.sendShortMsg(0x92, 0x5B, 9);
	}
	if (stateFX33) { 
		midi.sendShortMsg(0x93, 0x5B, 8);
	} else {
		midi.sendShortMsg(0x93, 0x5B, 9);
	}
	if (stateFX34) { 
		midi.sendShortMsg(0x94, 0x5B, 8);
	} else {
		midi.sendShortMsg(0x94, 0x5B, 9);
	}
}

NumarkMixTrackQuad.restoreFXRLEDsState = function(){
	var stateFXR1 = engine.getValue('[EffectRack1_EffectUnit1]', "group_[Channel1]_enable");
	var stateFXR2 = engine.getValue('[EffectRack1_EffectUnit2]', "group_[Channel2]_enable");
	var stateFXR3 = engine.getValue('[EffectRack1_EffectUnit3]', "group_[Channel3]_enable");
	var stateFXR4 = engine.getValue('[EffectRack1_EffectUnit4]', "group_[Channel4]_enable");
	if (stateFXR1) { 
		midi.sendShortMsg(0x91, 0x5C, 5); // match to .xml vvv
	} else {
		midi.sendShortMsg(0x91, 0x5C, 9);
	}
	if (stateFXR2) { 
		midi.sendShortMsg(0x92, 0x5C, 5);
	} else {
		midi.sendShortMsg(0x92, 0x5C, 9);
	}
	if (stateFXR3) { 
		midi.sendShortMsg(0x93, 0x5C, 8);
	} else {
		midi.sendShortMsg(0x93, 0x5C, 9);
	}
	if (stateFXR4) { 
		midi.sendShortMsg(0x94, 0x5C, 8);
	} else {
		midi.sendShortMsg(0x94, 0x5C, 9);
	}
}

NumarkMixTrackQuad.restoreDRLEDsState = function(){
	NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["directory"], NumarkMixTrackQuad.directoryMode);
	NumarkMixTrackQuad.setLED(NumarkMixTrackQuad.leds[0]["file"], !NumarkMixTrackQuad.directoryMode);
}

NumarkMixTrackQuad.restoreHPLEDsState = function(){
	var statePLF1 = engine.getValue('[Channel1]', "pfl");
	var statePLF2 = engine.getValue('[Channel2]', "pfl");
	var statePLF3 = engine.getValue('[Channel3]', "pfl");
	var statePLF4 = engine.getValue('[Channel4]', "pfl");
	midi.sendShortMsg(0x91, 0x47, statePLF1 );
	midi.sendShortMsg(0x92, 0x47, statePLF2 );
	midi.sendShortMsg(0x93, 0x47, statePLF3 );
	midi.sendShortMsg(0x94, 0x47, statePLF4 );
}

NumarkMixTrackQuad.restoreSYLEDsState = function(){
	var stateSYNC1 = engine.getValue('[Channel1]', "sync_enabled",1);
	var stateSYNC2 = engine.getValue('[Channel2]', "sync_enabled",1);
	var stateSYNC3 = engine.getValue('[Channel3]', "sync_enabled",1);
	var stateSYNC4 = engine.getValue('[Channel4]', "sync_enabled",1);
	midi.sendShortMsg(0x91, 0x40, stateSYNC1); 
	midi.sendShortMsg(0x92, 0x40, stateSYNC2); 
	midi.sendShortMsg(0x93, 0x40, stateSYNC3);
	midi.sendShortMsg(0x94, 0x40, stateSYNC4);
}

NumarkMixTrackQuad.restoreCULEDsState = function(){
	var stateCue1 = engine.getValue('[Channel1]', "play");
	var stateCue2 = engine.getValue('[Channel2]', "play");
	var stateCue3 = engine.getValue('[Channel3]', "play");
	var stateCue4 = engine.getValue('[Channel4]', "play");
	if (stateCue1 == 1) {midi.sendShortMsg(0x91, 0x33, 0); }else { midi.sendShortMsg(0x91, 0x33, 1 );}
	if (stateCue2 == 1) {midi.sendShortMsg(0x92, 0x33, 0); }else { midi.sendShortMsg(0x92, 0x33, 1 );}
	if (stateCue3 == 1) {midi.sendShortMsg(0x93, 0x33, 0); }else { midi.sendShortMsg(0x93, 0x33, 1 );}
	if (stateCue4 == 1) {midi.sendShortMsg(0x94, 0x33, 0); }else { midi.sendShortMsg(0x94, 0x33, 1 );}
}

NumarkMixTrackQuad.restorePLEDsState = function(){
	var statePlay1 = engine.getValue('[Channel1]', "play");
	var statePlay2 = engine.getValue('[Channel2]', "play");
	var statePlay3 = engine.getValue('[Channel3]', "play");
	var statePlay4 = engine.getValue('[Channel4]', "play");
	midi.sendShortMsg(0x91, 0x42, statePlay1);
	midi.sendShortMsg(0x92, 0x42, statePlay2);
	midi.sendShortMsg(0x93, 0x42, statePlay3);
	midi.sendShortMsg(0x94, 0x42, statePlay4);
}	

NumarkMixTrackQuad.peakIndicator = function(){
	if (NumarkMixTrackQuad.interuptLEDShow == 1)  {
		if (engine.getValue('[Master]', "PeakIndicator") && NumarkMixTrackQuad.peakLEDShow == 0) {
			NumarkMixTrackQuad.peakLEDShow = 1;
			midi.sendShortMsg(0x90, 0x4B, 1);
			midi.sendShortMsg(0x90, 0x4C, 0);
			
			midi.sendShortMsg(0x91, 0x63, 0)
			midi.sendShortMsg(0x91, 0x55, 0)
			midi.sendShortMsg(0x91, 0x54, 0)
			midi.sendShortMsg(0x91, 0x53, 0)
			
			midi.sendShortMsg(0x92, 0x63, 0)
			midi.sendShortMsg(0x92, 0x55, 0)
			midi.sendShortMsg(0x92, 0x54, 0)
			midi.sendShortMsg(0x92, 0x53, 0)
			
			midi.sendShortMsg(0x93, 0x63, 0)
			midi.sendShortMsg(0x93, 0x55, 0)
			midi.sendShortMsg(0x93, 0x54, 0)
			midi.sendShortMsg(0x93, 0x53, 0)
			
			midi.sendShortMsg(0x94, 0x63, 0)
			midi.sendShortMsg(0x94, 0x55, 0)
			midi.sendShortMsg(0x94, 0x54, 0)
			midi.sendShortMsg(0x94, 0x53, 0)
			
			NumarkMixTrackQuad.peakLEDs20Timer = engine.beginTimer(20, "NumarkMixTrackQuad.peakLEDs20()", true);
			NumarkMixTrackQuad.peakLEDs40Timer = engine.beginTimer(40, "NumarkMixTrackQuad.peakLEDs40()", true);
			NumarkMixTrackQuad.peakLEDs60Timer = engine.beginTimer(60, "NumarkMixTrackQuad.peakLEDs60()", true);
			NumarkMixTrackQuad.peakLEDs80Timer = engine.beginTimer(80, "NumarkMixTrackQuad.peakLEDs80()", true);
		}
		var peakLedsInd1 = engine.getValue('[Channel1]', "PeakIndicator");
		var peakLedsInd2 = engine.getValue('[Channel2]', "PeakIndicator");
		var peakLedsInd3 = engine.getValue('[Channel3]', "PeakIndicator");
		var peakLedsInd4 = engine.getValue('[Channel4]', "PeakIndicator");
		if (peakLedsInd1) {
			midi.sendShortMsg(0x91, 0x47, 0);
			engine.beginTimer(50, "midi.sendShortMsg(0x91, 0x47, 1);", true);
			engine.beginTimer(100, "NumarkMixTrackQuad.restoreHPLEDsState ();", true);
		}
		if (peakLedsInd2) {
			midi.sendShortMsg(0x92, 0x47, 0);
			engine.beginTimer(50, "midi.sendShortMsg(0x92, 0x47, 1);", true);
			engine.beginTimer(100, "NumarkMixTrackQuad.restoreHPLEDsState ();", true);
		}
		if (peakLedsInd3) {
			midi.sendShortMsg(0x93, 0x47, 0);
			engine.beginTimer(50, "midi.sendShortMsg(0x93, 0x47, 1);", true);
			engine.beginTimer(100, "NumarkMixTrackQuad.restoreHPLEDsState ();", true);
		}
		if (peakLedsInd4) {
			midi.sendShortMsg(0x94, 0x47, 0);
			engine.beginTimer(50, "midi.sendShortMsg(0x94, 0x47, 1);", true);
			engine.beginTimer(100, "NumarkMixTrackQuad.restoreHPLEDsState ();", true);
		}
	}
}

NumarkMixTrackQuad.peakLEDs20 = function () {
	midi.sendShortMsg(0x90, 0x4B, 0);
	midi.sendShortMsg(0x90, 0x4C, 1);
	
	midi.sendShortMsg(0x91, 0x63, 4); 
	midi.sendShortMsg(0x92, 0x53, 4);
	midi.sendShortMsg(0x93, 0x63, 4);
	midi.sendShortMsg(0x94, 0x53, 4);
}

NumarkMixTrackQuad.peakLEDs40 = function () {
	midi.sendShortMsg(0x91, 0x55, 4);
	midi.sendShortMsg(0x92, 0x54, 4);
	midi.sendShortMsg(0x93, 0x55, 4);
	midi.sendShortMsg(0x94, 0x54, 4);
}

NumarkMixTrackQuad.peakLEDs60 = function () {
	midi.sendShortMsg(0x91, 0x54, 1);
	midi.sendShortMsg(0x92, 0x55, 1);
	midi.sendShortMsg(0x93, 0x54, 1);
	midi.sendShortMsg(0x94, 0x55, 1);
}

NumarkMixTrackQuad.peakLEDs80 = function () {
	midi.sendShortMsg(0x91, 0x53, 1);	
	midi.sendShortMsg(0x92, 0x63, 1);
	midi.sendShortMsg(0x93, 0x53, 1);
	midi.sendShortMsg(0x94, 0x63, 1);
	engine.beginTimer(200, "NumarkMixTrackQuad.peakLEDsReset()", true);
}

NumarkMixTrackQuad.peakLEDsReset = function () {
	NumarkMixTrackQuad.peakLEDShow = 0;
	midi.sendShortMsg(0x91, 0x53, 7); // match to .xml vvv
	midi.sendShortMsg(0x92, 0x53, 7);
	midi.sendShortMsg(0x93, 0x53, 7);
	midi.sendShortMsg(0x94, 0x53, 7);
	midi.sendShortMsg(0x91, 0x54, 7);
	midi.sendShortMsg(0x92, 0x54, 7);
	midi.sendShortMsg(0x93, 0x54, 7);
	midi.sendShortMsg(0x94, 0x54, 7);
	midi.sendShortMsg(0x91, 0x55, 11);
	midi.sendShortMsg(0x92, 0x55, 11);
	midi.sendShortMsg(0x93, 0x55, 11);
	midi.sendShortMsg(0x94, 0x55, 11);
	midi.sendShortMsg(0x91, 0x63, 10);
	midi.sendShortMsg(0x92, 0x63, 10);
	midi.sendShortMsg(0x93, 0x63, 10);
	midi.sendShortMsg(0x94, 0x63, 10);
}

NumarkMixTrackQuad.sync1Led = function (channel, control, value, status, group) {
	var activebeat = engine.getValue('[Channel1]',"beat_active");
	if (activebeat)	{
		midi.sendShortMsg(0x91,0x4A,1);}
	else {
		midi.sendShortMsg(0x91,0x4A,0);
	}
	var secondsBlink = 30;
	var secondsToEnd = engine.getValue('[Channel1]', "duration") * (1-engine.getValue('[Channel1]', "playposition"));
	if (secondsToEnd < secondsBlink && secondsToEnd > 1 && engine.getValue('[Channel1]', "play")) {
		NumarkMixTrackQuad.flasher1 = NumarkMixTrackQuad.flasher1 + 1;
		if (NumarkMixTrackQuad.flasher1 == 1) {
			midi.sendShortMsg(0x91,0x33, 1);
		} else {
			midi.sendShortMsg(0x91,0x33, 0);
		}
		if (NumarkMixTrackQuad.flasher1 >= 1) NumarkMixTrackQuad.flasher1 = -1;
	}
}

NumarkMixTrackQuad.sync2Led = function (channel, control, value, status, group) {
	var activebeat = engine.getValue('[Channel2]',"beat_active");
	if (activebeat)	{
		midi.sendShortMsg(0x92,0x4A,1);}
	else {
		midi.sendShortMsg(0x92,0x4A,0);
	}
	var secondsBlink = 30;
	var secondsToEnd = engine.getValue('[Channel2]', "duration") * (1-engine.getValue('[Channel2]', "playposition"));
	if (secondsToEnd < secondsBlink && secondsToEnd > 1 && engine.getValue('[Channel2]', "play")) {
		NumarkMixTrackQuad.flasher2 = NumarkMixTrackQuad.flasher2 + 1;
		if (NumarkMixTrackQuad.flasher2 == 1) {
			midi.sendShortMsg(0x92,0x33, 1);
		} else {
			midi.sendShortMsg(0x92,0x33, 0);
		}
		if (NumarkMixTrackQuad.flasher2 >= 1) NumarkMixTrackQuad.flasher2 = -1;
	}
}

NumarkMixTrackQuad.sync3Led = function (channel, control, value, status, group) {
	var activebeat = engine.getValue('[Channel3]',"beat_active");
	if (activebeat)	{
		midi.sendShortMsg(0x93,0x4A,1);}
	else {
		midi.sendShortMsg(0x93,0x4A,0);
	}
	var secondsBlink = 30;
	var secondsToEnd = engine.getValue('[Channel3]', "duration") * (1-engine.getValue('[Channel3]', "playposition"));
	if (secondsToEnd < secondsBlink && secondsToEnd > 1 && engine.getValue('[Channel3]', "play")) {
		NumarkMixTrackQuad.flasher3 = NumarkMixTrackQuad.flasher3 + 1;
		if (NumarkMixTrackQuad.flasher3 == 1) {
			midi.sendShortMsg(0x93,0x33, 1);
		} else {
			midi.sendShortMsg(0x93,0x33, 0);
		}
		if (NumarkMixTrackQuad.flasher3 >= 1) NumarkMixTrackQuad.flasher3 = -1;
	}
}

NumarkMixTrackQuad.sync4Led = function (channel, control, value, status, group) {
	var activebeat = engine.getValue('[Channel4]',"beat_active");
	if (activebeat)	{
		midi.sendShortMsg(0x94,0x4A,1);}
	else {
		midi.sendShortMsg(0x94,0x4A,0);
	}
	var secondsBlink = 30;
	var secondsToEnd = engine.getValue('[Channel4]', "duration") * (1-engine.getValue('[Channel4]', "playposition"));
	if (secondsToEnd < secondsBlink && secondsToEnd > 1 && engine.getValue('[Channel4]', "play")) {
		NumarkMixTrackQuad.flasher4 = NumarkMixTrackQuad.flasher4 + 1;
		if (NumarkMixTrackQuad.flasher4 == 1) {
			midi.sendShortMsg(0x94,0x33, 1);
		} else {
			midi.sendShortMsg(0x94,0x33, 0);
		}
		if (NumarkMixTrackQuad.flasher4 >= 1) NumarkMixTrackQuad.flasher4 = -1;
	}
}

NumarkMixTrackQuad.activeButtonsR1 = {};
NumarkMixTrackQuad.unshiftedButtonsR1 = {
	knobR1FX1 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR1FX1 = engine.getValue('[EffectRack1_EffectUnit1_Effect1]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit1_Effect1]',"meta",oldR1FX1 + add);
	},
	knobR1FX2 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR1FX2 = engine.getValue('[EffectRack1_EffectUnit1_Effect2]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit1_Effect2]',"meta",oldR1FX2 + add);
	},
    knobR1FX3 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR1FX3 = engine.getValue('[EffectRack1_EffectUnit1_Effect3]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit1_Effect3]',"meta",oldR1FX3 + add);
    },
    knobR1FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX1F = engine.getValue('[EffectRack1_EffectUnit1]',"super1");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit1]',"super1",oldFX1F + add);
    },
    buttonR1Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 0.65; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel1]',"rate_temp_down",set);
    },
    buttonR1Range : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 1.35; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel1]',"rate_temp_up",set);
    },
    buttonR1Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel1]',"loop_halve",1);
			midi.sendShortMsg(0x91, 0x63, 1);
		} else {
			midi.sendShortMsg(0x91, 0x63, 10);
		}
	},
	buttonR1C1 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_1_enabled")) {
				engine.setValue('[Channel1]',"hotcue_1_activate",1);
				midi.sendShortMsg(0x91, 0x6D, 2);
			} else {
				engine.setValue('[Channel1]',"hotcue_1_set",1);	
				midi.sendShortMsg(0x91, 0x6D, 5);
			}
		} else {
			if (engine.getValue('[Channel1]',"hotcue_1_set")) {
				var R1C1Col = engine.getValue('[Channel1]',"hotcue_1_color")
				var R1C1NewCol= outputColor (R1C1Col);
				midi.sendShortMsg(0x91, 0x6D, R1C1NewCol);
			} else {
				midi.sendShortMsg(0x91, 0x6D, 9);	
			}
		}
	},   
	buttonR1C2 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_2_enabled")) {
				engine.setValue('[Channel1]',"hotcue_2_activate",1);
				midi.sendShortMsg(0x91, 0x6E, 2);
			} else {
				engine.setValue('[Channel1]',"hotcue_2_set",1);	
				midi.sendShortMsg(0x91, 0x6E, 5);
			}
		} else {
			if (engine.getValue('[Channel1]',"hotcue_2_set")) {
				var R1C2Col = engine.getValue('[Channel1]',"hotcue_2_color")
				var R1C2NewCol= outputColor (R1C2Col);
				midi.sendShortMsg(0x91, 0x6E, R1C2NewCol);
			} else {
				midi.sendShortMsg(0x91, 0x6E, 9);	
			}
		}
	},   
	buttonR1C3 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_3_enabled")) {
				engine.setValue('[Channel1]',"hotcue_3_activate",1);
				midi.sendShortMsg(0x91, 0x6F, 2);
			} else {
				engine.setValue('[Channel1]',"hotcue_3_set",1);	
				midi.sendShortMsg(0x91, 0x6F, 5);
			}
		} else {
			if (engine.getValue('[Channel1]',"hotcue_3_set")) {
				var R1C3Col = engine.getValue('[Channel1]',"hotcue_3_color")
				var R1C3NewCol= outputColor (R1C3Col);
				midi.sendShortMsg(0x91, 0x6F, R1C3NewCol);
			} else {
				midi.sendShortMsg(0x91, 0x6F, 9);	
			}
		}
	},
	buttonR1C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_4_enabled")) {
				engine.setValue('[Channel1]',"hotcue_4_activate",1);
				midi.sendShortMsg(0x91, 0x70, 2);
			} else {
				engine.setValue('[Channel1]',"hotcue_4_set",1);	
				midi.sendShortMsg(0x91, 0x70, 5);
			}
		} else {
			if (engine.getValue('[Channel1]',"hotcue_4_set")) {
				var R1C4Col = engine.getValue('[Channel1]',"hotcue_4_color")
				var R1C4NewCol= outputColor (R1C4Col);
				midi.sendShortMsg(0x91, 0x70, R1C4NewCol);
			} else {
				midi.sendShortMsg(0x91, 0x70, 9);	
			}
		}
	}
};
NumarkMixTrackQuad.shiftedButtonsR1 = {
    knobR1FX1 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit1_Effect1]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit1_Effect1]',"effect_selector",-1);
		};
    },
    knobR1FX2 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit1_Effect2]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit1_Effect2]',"effect_selector",-1);
		};
    },
    knobR1FX3 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit1_Effect3]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit1_Effect3]',"effect_selector",-1);
		};
    },
    knobR1FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX1F = engine.getValue('[EffectRack1_EffectUnit1]',"mix");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit1]',"mix",oldFX1F + add);
    },
    buttonR1Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value == 127) {
			if (!NumarkMixTrackQuad.scratchMode[deck-1]) {
				var oldKLset = engine.getValue('[Channel1]',"keylock");
				if (oldKLset == 0) {set = 1 } else { set = 0 };
				engine.setValue('[Channel1]',"keylock",set);
			} else {
				if (engine.getValue('[Channel1]',"slip_enabled")) {
					engine.setValue('[Channel1]',"slip_enabled",0);	
				} else {
					engine.setValue('[Channel1]',"slip_enabled",1);	
				}
			}
		}
    },
    buttonR1Range : function (channel, control, value, status, group) {
		if (value == 127) {
			var oldRGset = engine.getValue('[Channel1]',"rateRange");
			if (oldRGset == 0.06) {
				set = 0.08;
			} else if (oldRGset == 0.08) {
				set = 0.10;
			} else if (oldRGset == 0.10) {
				set = 0.12;
			} else if (oldRGset == 0.12) {
				set = 0.20;
			} else if (oldRGset == 0.20) {
				set = 0.25;
			} else if (oldRGset == 0.25) {
				set = 0.33;
			} else if (oldRGset == 0.33) {
				set = 0.50;
			} else if (oldRGset == 0.50) {
				set = 1.00;
			} else if (oldRGset == 1.00) {
				set = 2.00;
			} else if (oldRGset == 2.00) {
				set = 4.00;
			} else if (oldRGset == 4.00) {
				set = 0.06;
			}
			engine.setValue('[Channel1]',"rateRange",set);
		}
    },
    buttonR1Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel1]',"loop_double",1);
			midi.sendShortMsg(0x91, 0x63, 5);
		} else {
			midi.sendShortMsg(0x91, 0x63, 10);
		}
	},    
	buttonR1C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_1_set") || engine.getValue('[Channel1]',"hotcue_2_set") || engine.getValue('[Channel1]',"hotcue_3_set") || engine.getValue('[Channel1]',"hotcue_4_set")) {
				NumarkMixTrackQuad.deleteMode(group, channel)
				midi.sendShortMsg(0x91, 0x70, 1);
			}
		} else {
			midi.sendShortMsg(0x91, 0x70, 9);
		}
	}
};
NumarkMixTrackQuad.SHFT1 = function (channel, control, value, status, group) {
	SHFTD1 = value;
	if ((SHFTD1 == 127 && SHFTD2 == 127) || (SHFTD1 == 127 && SHFTD4 == 127) || (SHFTD3 == 127 && SHFTD2 == 127) || (SHFTD3 == 127 && SHFTD4 == 127)) {
		if (engine.getValue('[AutoDJ]', 'enabled') != 1) {
			engine.setValue('[AutoDJ]', 'enabled', 1);
			NumarkMixTrackQuad.untouched = 1;
		} else {
			engine.setValue('[AutoDJ]', 'enabled', 0);
		}
	}
    if (value === 127) {
        NumarkMixTrackQuad.activeButtonsR1 = NumarkMixTrackQuad.shiftedButtonsR1;
    } else {
        NumarkMixTrackQuad.activeButtonsR1 = NumarkMixTrackQuad.unshiftedButtonsR1;
    }
}

NumarkMixTrackQuad.activeButtonsR2 = {};
NumarkMixTrackQuad.unshiftedButtonsR2 = {
	knobR2FX1 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR2FX1 = engine.getValue('[EffectRack1_EffectUnit2_Effect1]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit2_Effect1]',"meta",oldR2FX1 + add);
	},
	knobR2FX2 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR2FX2 = engine.getValue('[EffectRack1_EffectUnit2_Effect2]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit2_Effect2]',"meta",oldR2FX2 + add);
	},
    knobR2FX3 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR2FX3 = engine.getValue('[EffectRack1_EffectUnit2_Effect3]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit2_Effect3]',"meta",oldR2FX3 + add);
    },
    knobR2FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX2F = engine.getValue('[EffectRack1_EffectUnit2]',"super1");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit2]',"super1",oldFX2F + add);
    },
    buttonR2Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 0.65; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel2]',"rate_temp_down",set);
    },
    buttonR2Range : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 1.35; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel2]',"rate_temp_up",set);
    },
    buttonR2Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel2]',"loop_halve",1);
			midi.sendShortMsg(0x92, 0x63, 1);
		} else {
			midi.sendShortMsg(0x92, 0x63, 10);
		}
	},
	buttonR2C1 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel2]',"hotcue_1_enabled")) {
				engine.setValue('[Channel2]',"hotcue_1_activate",1);
				midi.sendShortMsg(0x92, 0x6D, 2);
			} else {
				engine.setValue('[Channel2]',"hotcue_1_set",1);	
				midi.sendShortMsg(0x92, 0x6D, 5);
			}
		} else {
			if (engine.getValue('[Channel2]',"hotcue_1_set")) {
				var R2C1Col = engine.getValue('[Channel2]',"hotcue_1_color")
				var R2C1NewCol= outputColor (R2C1Col);
				midi.sendShortMsg(0x92, 0x6D, R2C1NewCol);
			} else {
				midi.sendShortMsg(0x92, 0x6D, 9);	
			}
		}
	},   
	buttonR2C2 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel2]',"hotcue_2_enabled")) {
				engine.setValue('[Channel2]',"hotcue_2_activate",1);
				midi.sendShortMsg(0x92, 0x6E, 2);
			} else {
				engine.setValue('[Channel2]',"hotcue_2_set",1);	
				midi.sendShortMsg(0x92, 0x6E, 5);
			}
		} else {
			if (engine.getValue('[Channel2]',"hotcue_2_set")) {
				var R2C2Col = engine.getValue('[Channel2]',"hotcue_2_color")
				var R2C2NewCol= outputColor (R2C2Col);
				midi.sendShortMsg(0x92, 0x6E, R2C2NewCol);
			} else {
				midi.sendShortMsg(0x92, 0x6E, 9);	
			}
		}
	},   
	buttonR2C3 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel2]',"hotcue_3_enabled")) {
				engine.setValue('[Channel2]',"hotcue_3_activate",1);
				midi.sendShortMsg(0x92, 0x6F, 2);
			} else {
				engine.setValue('[Channel2]',"hotcue_3_set",1);	
				midi.sendShortMsg(0x92, 0x6F, 5);
			}
		} else {
			if (engine.getValue('[Channel2]',"hotcue_3_set")) {
				var R2C3Col = engine.getValue('[Channel2]',"hotcue_3_color")
				var R2C3NewCol= outputColor (R2C3Col);
				midi.sendShortMsg(0x92, 0x6F, R2C3NewCol);
			} else {
				midi.sendShortMsg(0x92, 0x6F, 9);	
			}
		}
	},
	buttonR2C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel2]',"hotcue_4_enabled")) {
				engine.setValue('[Channel2]',"hotcue_4_activate",1);
				midi.sendShortMsg(0x92, 0x70, 2);
			} else {
				engine.setValue('[Channel2]',"hotcue_4_set",1);	
				midi.sendShortMsg(0x92, 0x70, 5);
			}
		} else {
			if (engine.getValue('[Channel2]',"hotcue_4_set")) {
				var R2C4Col = engine.getValue('[Channel2]',"hotcue_4_color")
				var R2C4NewCol= outputColor (R2C4Col);
				midi.sendShortMsg(0x92, 0x70, R2C4NewCol);
			} else {
				midi.sendShortMsg(0x92, 0x70, 9);	
			}
		}
	}
};
NumarkMixTrackQuad.shiftedButtonsR2 = {
    knobR2FX1 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit2_Effect1]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit2_Effect1]',"effect_selector",-1);
		}
    },
    knobR2FX2 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit2_Effect2]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit2_Effect2]',"effect_selector",-1);
		}
    },
    knobR2FX3 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit2_Effect3]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit2_Effect3]',"effect_selector",-1);
		}
    },
    knobR2FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX2F = engine.getValue('[EffectRack1_EffectUnit2]',"mix");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit2]',"mix",oldFX2F + add);
    },
    buttonR2Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value == 127) {
			if (!NumarkMixTrackQuad.scratchMode[deck-1]) {
				var oldKLset = engine.getValue('[Channel2]',"keylock");
				if (oldKLset == 0) {set = 1 } else { set = 0 };
				engine.setValue('[Channel2]',"keylock",set);
			} else {
				if (engine.getValue('[Channel2]',"slip_enabled")) {
					engine.setValue('[Channel2]',"slip_enabled",0);	
				} else {
					engine.setValue('[Channel2]',"slip_enabled",1);	
				}
			}
		}
    },
    buttonR2Range : function (channel, control, value, status, group) {
		if (value == 127) {
			var oldRGset = engine.getValue('[Channel2]',"rateRange");
			if (oldRGset == 0.06) {
				set = 0.08;
			} else if (oldRGset == 0.08) {
				set = 0.10;
			} else if (oldRGset == 0.10) {
				set = 0.12;
			} else if (oldRGset == 0.12) {
				set = 0.20;
			} else if (oldRGset == 0.20) {
				set = 0.25;
			} else if (oldRGset == 0.25) {
				set = 0.33;
			} else if (oldRGset == 0.33) {
				set = 0.50;
			} else if (oldRGset == 0.50) {
				set = 1.00;
			} else if (oldRGset == 1.00) {
				set = 2.00;
			} else if (oldRGset == 2.00) {
				set = 4.00;
			} else if (oldRGset == 4.00) {
				set = 0.06;
			}
			engine.setValue('[Channel2]',"rateRange",set);
		}
	},
    buttonR2Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel2]',"loop_double",1);
			midi.sendShortMsg(0x92, 0x63, 5);
		} else {
			midi.sendShortMsg(0x92, 0x63, 10);
		}
	},    
	buttonR2C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_1_set") || engine.getValue('[Channel1]',"hotcue_2_set") || engine.getValue('[Channel1]',"hotcue_3_set") || engine.getValue('[Channel1]',"hotcue_4_set")) {
				NumarkMixTrackQuad.deleteMode(group, channel)
				midi.sendShortMsg(0x92, 0x70, 1);
			}
		} else {
			midi.sendShortMsg(0x92, 0x70, 9);
		}
	}
};
NumarkMixTrackQuad.SHFT2 = function (channel, control, value, status, group) {
	SHFTD2 = value;
	if ((SHFTD1 == 127 && SHFTD2 == 127) || (SHFTD1 == 127 && SHFTD4 == 127) || (SHFTD3 == 127 && SHFTD2 == 127) || (SHFTD3 == 127 && SHFTD4 == 127)) {
		if (engine.getValue('[AutoDJ]', 'enabled') != 1) {
			engine.setValue('[AutoDJ]', 'enabled', 1);
			NumarkMixTrackQuad.untouched = 1;
		} else {
			engine.setValue('[AutoDJ]', 'enabled', 0);
		}
	}
    if (value === 127) {
        NumarkMixTrackQuad.activeButtonsR2 = NumarkMixTrackQuad.shiftedButtonsR2;
    } else {
        NumarkMixTrackQuad.activeButtonsR2 = NumarkMixTrackQuad.unshiftedButtonsR2;
    }
}

NumarkMixTrackQuad.activeButtonsR3 = {};
NumarkMixTrackQuad.unshiftedButtonsR3 = {
	knobR3FX1 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR3FX1 = engine.getValue('[EffectRack1_EffectUnit3_Effect1]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit3_Effect1]',"meta",oldR3FX1 + add);
	},
	knobR3FX2 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR3FX2 = engine.getValue('[EffectRack1_EffectUnit3_Effect2]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit3_Effect2]',"meta",oldR3FX2 + add);
	},
    knobR3FX3 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR3FX3 = engine.getValue('[EffectRack1_EffectUnit3_Effect3]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit3_Effect3]',"meta",oldR3FX3 + add);
    },
    knobR3FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX3F = engine.getValue('[EffectRack1_EffectUnit3]',"super1");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit3]',"super1",oldFX3F + add);
    },
    buttonR3Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 0.65; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel3]',"rate_temp_down",set);
    },
    buttonR3Range : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 1.35; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel3]',"rate_temp_up",set);
    },
    buttonR3Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel3]',"loop_halve",1);
			midi.sendShortMsg(0x93, 0x63, 1);
		} else {
			midi.sendShortMsg(0x93, 0x63, 10);
		}
	},
	buttonR3C1 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel3]',"hotcue_1_enabled")) {
				engine.setValue('[Channel3]',"hotcue_1_activate",1);
				midi.sendShortMsg(0x93, 0x6D, 2);
			} else {
				engine.setValue('[Channel3]',"hotcue_1_set",1);	
				midi.sendShortMsg(0x93, 0x6D, 5);
			}
		} else {
			if (engine.getValue('[Channel3]',"hotcue_1_set")) {
				var R3C1Col = engine.getValue('[Channel3]',"hotcue_1_color")
				var R3C1NewCol= outputColor (R3C1Col);
				midi.sendShortMsg(0x93, 0x6D, R3C1NewCol);
			} else {
				midi.sendShortMsg(0x93, 0x6D, 9);	
			}
		}
	},   
	buttonR3C2 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel3]',"hotcue_2_enabled")) {
				engine.setValue('[Channel3]',"hotcue_2_activate",1);
				midi.sendShortMsg(0x93, 0x6E, 2);
			} else {
				engine.setValue('[Channel3]',"hotcue_2_set",1);	
				midi.sendShortMsg(0x93, 0x6E, 5);
			}
		} else {
			if (engine.getValue('[Channel3]',"hotcue_2_set")) {
				var R3C2Col = engine.getValue('[Channel3]',"hotcue_2_color")
				var R3C2NewCol= outputColor (R3C2Col);
				midi.sendShortMsg(0x93, 0x6E, R3C2NewCol);
			} else {
				midi.sendShortMsg(0x93, 0x6E, 9);	
			}
		}
	},   
	buttonR3C3 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel3]',"hotcue_3_enabled")) {
				engine.setValue('[Channel3]',"hotcue_3_activate",1);
				midi.sendShortMsg(0x93, 0x6F, 2);
			} else {
				engine.setValue('[Channel3]',"hotcue_3_set",1);	
				midi.sendShortMsg(0x93, 0x6F, 5);
			}
		} else {
			if (engine.getValue('[Channel3]',"hotcue_3_set")) {
				var R3C3Col = engine.getValue('[Channel3]',"hotcue_3_color")
				var R3C3NewCol= outputColor (R3C3Col);
				midi.sendShortMsg(0x93, 0x6F, R3C3NewCol);
			} else {
				midi.sendShortMsg(0x93, 0x6F, 9);	
			}
		}
	},
	buttonR3C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel3]',"hotcue_4_enabled")) {
				engine.setValue('[Channel3]',"hotcue_4_activate",1);
				midi.sendShortMsg(0x93, 0x70, 2);
			} else {
				engine.setValue('[Channel3]',"hotcue_4_set",1);	
				midi.sendShortMsg(0x93, 0x70, 5);
			}
		} else {
			if (engine.getValue('[Channel3]',"hotcue_4_set")) {
				var R3C4Col = engine.getValue('[Channel3]',"hotcue_4_color")
				var R3C4NewCol= outputColor (R3C4Col);
				midi.sendShortMsg(0x93, 0x70, R3C4NewCol);
			} else {
				midi.sendShortMsg(0x93, 0x70, 9);	
			}
		}
	}
};
NumarkMixTrackQuad.shiftedButtonsR3 = {
    knobR3FX1 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit3_Effect1]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit3_Effect1]',"effect_selector",-1);
		}
    },
    knobR3FX2 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit3_Effect2]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit3_Effect2]',"effect_selector",-1);
		}
    },
    knobR3FX3 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit3_Effect3]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit3_Effect3]',"effect_selector",-1);
		}
    },
    knobR3FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX3F = engine.getValue('[EffectRack1_EffectUnit3]',"mix");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit3]',"mix",oldFX3F + add);
    },
    buttonR3Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value == 127) {
			if (!NumarkMixTrackQuad.scratchMode[deck-1]) {
				var oldKLset = engine.getValue('[Channel3]',"keylock");
				if (oldKLset == 0) {set = 1 } else { set = 0 };
				engine.setValue('[Channel3]',"keylock",set);
			} else {
				if (engine.getValue('[Channel3]',"slip_enabled")) {
					engine.setValue('[Channel3]',"slip_enabled",0);	
				} else {
					engine.setValue('[Channel3]',"slip_enabled",1);	
				}
			}
		}
    },
    buttonR3Range : function (channel, control, value, status, group) {
		if (value == 127) {
			var oldRGset = engine.getValue('[Channel3]',"rateRange");
			if (oldRGset == 0.06) {
				set = 0.08;
			} else if (oldRGset == 0.08) {
				set = 0.10;
			} else if (oldRGset == 0.10) {
				set = 0.12;
			} else if (oldRGset == 0.12) {
				set = 0.20;
			} else if (oldRGset == 0.20) {
				set = 0.25;
			} else if (oldRGset == 0.25) {
				set = 0.33;
			} else if (oldRGset == 0.33) {
				set = 0.50;
			} else if (oldRGset == 0.50) {
				set = 1.00;
			} else if (oldRGset == 1.00) {
				set = 2.00;
			} else if (oldRGset == 2.00) {
				set = 4.00;
			} else if (oldRGset == 4.00) {
				set = 0.06;
			}
			engine.setValue('[Channel3]',"rateRange",set);
		}
	},
    buttonR3Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel3]',"loop_double",1);
			midi.sendShortMsg(0x93, 0x63, 5);
		} else {
			midi.sendShortMsg(0x93, 0x63, 10);
		}
	},    
	buttonR3C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_1_set") || engine.getValue('[Channel1]',"hotcue_2_set") || engine.getValue('[Channel1]',"hotcue_3_set") || engine.getValue('[Channel1]',"hotcue_4_set")) {
				NumarkMixTrackQuad.deleteMode(group, channel)
				midi.sendShortMsg(0x93, 0x70, 1);
			}
		} else {
			midi.sendShortMsg(0x93, 0x70, 9);
		}
	}
};
NumarkMixTrackQuad.SHFT3 = function (channel, control, value, status, group) {
	SHFTD3 = value;
	if ((SHFTD1 == 127 && SHFTD2 == 127) || (SHFTD1 == 127 && SHFTD4 == 127) || (SHFTD3 == 127 && SHFTD2 == 127) || (SHFTD3 == 127 && SHFTD4 == 127)) {
		if (engine.getValue('[AutoDJ]', 'enabled') != 1) {
			engine.setValue('[AutoDJ]', 'enabled', 1);
			NumarkMixTrackQuad.untouched = 1;
		} else {
			engine.setValue('[AutoDJ]', 'enabled', 0);
		}
	}
    if (value === 127) {
        NumarkMixTrackQuad.activeButtonsR3 = NumarkMixTrackQuad.shiftedButtonsR3;
    } else {
        NumarkMixTrackQuad.activeButtonsR3 = NumarkMixTrackQuad.unshiftedButtonsR3;
    }
}

NumarkMixTrackQuad.activeButtonsR4 = {};
NumarkMixTrackQuad.unshiftedButtonsR4 = {
	knobR4FX1 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR4FX1 = engine.getValue('[EffectRack1_EffectUnit4_Effect1]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit4_Effect1]',"meta",oldR4FX1 + add);
	},
	knobR4FX2 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR4FX2 = engine.getValue('[EffectRack1_EffectUnit4_Effect2]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit4_Effect2]',"meta",oldR4FX2 + add);
	},
    knobR4FX3 : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldR4FX3 = engine.getValue('[EffectRack1_EffectUnit4_Effect3]',"meta");
		if (value > 63) {add = -0.05 } else { add = 0.05 };
		engine.setValue('[EffectRack1_EffectUnit4_Effect3]',"meta",oldR4FX3 + add);
    },
    knobR4FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX4F = engine.getValue('[EffectRack1_EffectUnit4]',"super1");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit4]',"super1",oldFX4F + add);
    },
    buttonR4Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 0.65; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel4]',"rate_temp_down",set);
    },
    buttonR4Range : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value > 63) {set = 1; NumarkMixTrackQuad.reverse[deck-1] = 1.35; } else { set = 0; NumarkMixTrackQuad.reverse[deck-1] = 1;};
		engine.setValue('[Channel4]',"rate_temp_up",set);
    },
    buttonR4Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel4]',"loop_halve",1);
			midi.sendShortMsg(0x94, 0x63, 1);
		} else {
			midi.sendShortMsg(0x94, 0x63, 10);
		}
	},
	buttonR4C1 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel4]',"hotcue_1_enabled")) {
				engine.setValue('[Channel4]',"hotcue_1_activate",1);
				midi.sendShortMsg(0x94, 0x6D, 2);
			} else {
				engine.setValue('[Channel4]',"hotcue_1_set",1);	
				midi.sendShortMsg(0x94, 0x6D, 5);
			}
		} else {
			if (engine.getValue('[Channel4]',"hotcue_1_set")) {
				var R4C1Col = engine.getValue('[Channel4]',"hotcue_1_color")
				var R4C1NewCol= outputColor (R4C1Col);
				midi.sendShortMsg(0x94, 0x6D, R4C1NewCol);
			} else {
				midi.sendShortMsg(0x94, 0x6D, 9);	
			}
		}
	},   
	buttonR4C2 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel4]',"hotcue_2_enabled")) {
				engine.setValue('[Channel4]',"hotcue_2_activate",1);
				midi.sendShortMsg(0x94, 0x6E, 2);
			} else {
				engine.setValue('[Channel4]',"hotcue_2_set",1);	
				midi.sendShortMsg(0x94, 0x6E, 5);
			}
		} else {
			if (engine.getValue('[Channel4]',"hotcue_2_set")) {
				var R4C2Col = engine.getValue('[Channel4]',"hotcue_2_color")
				var R4C2NewCol= outputColor (R4C2Col);
				midi.sendShortMsg(0x94, 0x6E, R4C2NewCol);
			} else {
				midi.sendShortMsg(0x94, 0x6E, 9);	
			}
		}
	},   
	buttonR4C3 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel4]',"hotcue_3_enabled")) {
				engine.setValue('[Channel4]',"hotcue_3_activate",1);
				midi.sendShortMsg(0x94, 0x6F, 2);
			} else {
				engine.setValue('[Channel4]',"hotcue_3_set",1);	
				midi.sendShortMsg(0x94, 0x6F, 5);
			}
		} else {
			if (engine.getValue('[Channel1]',"hotcue_3_set")) {
				var R4C3Col = engine.getValue('[Channel4]',"hotcue_3_color")
				var R4C3NewCol= outputColor (R4C3Col);
				midi.sendShortMsg(0x94, 0x6F, R4C3NewCol);
			} else {
				midi.sendShortMsg(0x94, 0x6F, 9);	
			}
		}
	},
	buttonR4C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel4]',"hotcue_4_enabled")) {
				engine.setValue('[Channel4]',"hotcue_4_activate",1);
				midi.sendShortMsg(0x94, 0x70, 2);
			} else {
				engine.setValue('[Channel4]',"hotcue_4_set",1);	
				midi.sendShortMsg(0x94, 0x70, 5);
			}
		} else {
			if (engine.getValue('[Channel4]',"hotcue_4_set")) {
				var R4C4Col = engine.getValue('[Channel4]',"hotcue_4_color")
				var R4C4NewCol= outputColor (R4C4Col);
				midi.sendShortMsg(0x94, 0x70, R4C4NewCol);
			} else {
				midi.sendShortMsg(0x94, 0x70, 9);	
			}
		}
	}
};
NumarkMixTrackQuad.shiftedButtonsR4 = {
    knobR4FX1 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit4_Effect1]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit4_Effect1]',"effect_selector",-1);
		}
    },
    knobR4FX2 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit4_Effect2]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit4_Effect2]',"effect_selector",-1);
		}
    },
    knobR4FX3 : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[EffectRack1_EffectUnit4_Effect3]',"effect_selector",1);
		} else {
			engine.setValue('[EffectRack1_EffectUnit4_Effect3]',"effect_selector",-1);
		}
    },
    knobR4FXF : function (channel, control, value, status, group) {
		NumarkMixTrackQuad.untouched = -3;
		var add = 0;
		var oldFX4F = engine.getValue('[EffectRack1_EffectUnit4]',"mix");
		if (value > 63) {add = -0.05 } else { add = 0.05 }
		engine.setValue('[EffectRack1_EffectUnit4]',"mix",oldFX4F + add);
    },
    buttonR4Keylock : function (channel, control, value, status, group) {
		var deck = NumarkMixTrackQuad.groupToDeck(group);
		if (value == 127) {
			if (!NumarkMixTrackQuad.scratchMode[deck-1]) {
				var oldKLset = engine.getValue('[Channel4]',"keylock");
				if (oldKLset == 0) {set = 1 } else { set = 0 };
				engine.setValue('[Channel4]',"keylock",set);
			} else {
				if (engine.getValue('[Channel4]',"slip_enabled")) {
					engine.setValue('[Channel4]',"slip_enabled",0);	
				} else {
					engine.setValue('[Channel4]',"slip_enabled",1);	
				}
			}
		}
    },
    buttonR4Range : function (channel, control, value, status, group) {
		if (value == 127) {
			var oldRGset = engine.getValue('[Channel4]',"rateRange");
			if (oldRGset == 0.06) {
				set = 0.08;
			} else if (oldRGset == 0.08) {
				set = 0.10;
			} else if (oldRGset == 0.10) {
				set = 0.12;
			} else if (oldRGset == 0.12) {
				set = 0.20;
			} else if (oldRGset == 0.20) {
				set = 0.25;
			} else if (oldRGset == 0.25) {
				set = 0.33;
			} else if (oldRGset == 0.33) {
				set = 0.50;
			} else if (oldRGset == 0.50) {
				set = 1.00;
			} else if (oldRGset == 1.00) {
				set = 2.00;
			} else if (oldRGset == 2.00) {
				set = 4.00;
			} else if (oldRGset == 4.00) {
				set = 0.06;
			}
			engine.setValue('[Channel4]',"rateRange",set);
		}
	},
    buttonR4Halve : function (channel, control, value, status, group) {
		if (value > 63) {
			engine.setValue('[Channel4]',"loop_double",1);
			midi.sendShortMsg(0x94, 0x63, 5);
		} else {
			midi.sendShortMsg(0x94, 0x63, 10);
		}
	},    
	buttonR4C4 : function (channel, control, value, status, group) {
		if (value > 63) {
			if (engine.getValue('[Channel1]',"hotcue_1_set") || engine.getValue('[Channel1]',"hotcue_2_set") || engine.getValue('[Channel1]',"hotcue_3_set") || engine.getValue('[Channel1]',"hotcue_4_set")) {
				NumarkMixTrackQuad.deleteMode(group, channel)
				midi.sendShortMsg(0x94, 0x70, 1);
			}
		} else {
			midi.sendShortMsg(0x94, 0x70, 9);
		}
	}
};
NumarkMixTrackQuad.SHFT4 = function (channel, control, value, status, group) {
	SHFTD4 = value;
	if ((SHFTD1 == 127 && SHFTD2 == 127) || (SHFTD1 == 127 && SHFTD4 == 127) || (SHFTD3 == 127 && SHFTD2 == 127) || (SHFTD3 == 127 && SHFTD4 == 127)) {
		if (engine.getValue('[AutoDJ]', 'enabled') != 1) {
			engine.setValue('[AutoDJ]', 'enabled', 1);
			NumarkMixTrackQuad.untouched = 1;
		} else {
			engine.setValue('[AutoDJ]', 'enabled', 0);
		}
	}
    if (value === 127) {
        NumarkMixTrackQuad.activeButtonsR4 = NumarkMixTrackQuad.shiftedButtonsR4;
    } else {
        NumarkMixTrackQuad.activeButtonsR4 = NumarkMixTrackQuad.unshiftedButtonsR4;
    }
}

//------------------------------------------// to get 16 colors on hotcues set color options to use Recordbox hotcue colors 
//------------------------------------------// from those 16 colors we can get a pretty close match for most with the codes bellow 
//------------------------------------------// #   APP COLOR	APP ARG		USED INSTEAD
outputColor = function(colorCode) {			
	if (colorCode == "15083560") { 			// 1   #e62828 		15083560	0x01 RED
		return "0x01";
	} else if (colorCode == "14705691") {	// 2   #e0641b		14705691	0x02 ORANGE
		return "0x02";
	} else if (colorCode == "12824324") {	// 3   #c3af04		12824324	0x04 YELLOW
		return "0x04";
	} else if (colorCode == "11845124") {	// 4   #b4be04		11845124   	0x04 YELLOW
		return "0x04";
	} else if (colorCode == "2679316") {	// 5   #28e214		2679316		0x05 GREEN
		return "0x05";
	} else if (colorCode == "1094006") {	// 6   #10b176		1094006		0x06 L GREEN
		return "0x06";
	} else if (colorCode == "2073474") {	// 7   #1fa382		2073474		0x06 L GREEN
		return "0x06"; 
	} else if (colorCode == "5289215") {	// 8   #50b4ff		5289215		0x08 L BLUE
		return "0x08";
	} else if (colorCode == "3169023") {	// 9   #305aff		3169023		0x09 BLUE
		return "0x09"; 
	} else if (colorCode == "11158271") {	// 10  #aa42ff	 	11158271	0x0A PURPLE
		return "0x0A";
	} else if (colorCode == "14566607") {	// 11  #de44cf		14566607	0x0F PEACH
		return "0x0F";
	} else if (colorCode == "16716411") { 	// 12  #ff127b		16716411	0x0B PINK
		return "0x0B";
	} else if (colorCode == "11809535") {	// 13  #8432ff		11809535	0x0A PURPLE
		return "0x0A";
	} else if (colorCode == "10871062") {	// 14  #a5e116		10871062	0x0E L YELLOW
		return "0x0E";
	} else if (colorCode == "6583295") {	// 15  #6473ff		6583295		0x08 L BLUE
		return "0x08";
	} else if (colorCode == "57599") {		// 16  #00e0ff		57599	 	0x07 G BLUE
		return "0x07";
	}
}

NumarkMixTrackQuad.deleteMode = function(group, channel) {
	if (engine.getValue(group,"hotcue_1_set")) { 
		engine.setValue(group,"hotcue_1_clear",1);
		midi.sendShortMsg((0x90 + channel ), 0x6D, 9);
	}
	if ( engine.getValue(group,"hotcue_2_set")) {
		engine.setValue(group,"hotcue_2_clear",1);
		midi.sendShortMsg((0x90 + channel ), 0x6E, 9);
	}
	if ( engine.getValue(group,"hotcue_3_set")) {
		engine.setValue(group,"hotcue_3_clear",1);
		midi.sendShortMsg((0x90 + channel ), 0x6F, 9);
	}
	if ( engine.getValue(group,"hotcue_4_set")) {
		engine.setValue(group,"hotcue_4_clear",1);
		midi.sendShortMsg((0x90 + channel ), 0x70, 9);
	}
}
