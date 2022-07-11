/**
 * This node is copyright (c) 2017-2022 Peter Scargill. Please consider
 * it free to use for whatever timing purpose you like. If you wish to make
 * changes please note you have the full source when you install BigTimer which
 * essentially is just 2 files (html and js). I maintain BigTimer via 
 * https://tech.scargill.net/big-timer and will look at any code with a view to 
 * incorporating in the main BigTimer. I will not however support or comment on 
 * any unofficial "github repositories". I do not use Github for this as I'd
 * rather encourage people to send code to me to test and release rather than confuse
 * any of the many users of BigTimer with various clones and versions. See version 
 * number in package.json
 *
 * If you find BigTimer REALLY useful - on the blog (right column) is a PAYPAL link to
 * help support the blog and fund my need for new gadgets.
 * away added 1/1/2022
 */


module.exports = function (RED) {
    "use strict";
    const SunCalc = require('suncalc');
    const { DateTime } = require("luxon");
    const pad = require('./helpers/pad');
    const randomInt = require('./helpers/randomInt');
    const dayInMonth = require('./helpers/dayInMonth');
    const minutesSinceMidnight = require('./helpers/minutesSinceMidnight');

    function bigTimerNode(inputParameters) {
        RED.nodes.createNode(this, inputParameters);
        var node = this;

        Object.keys(inputParameters).forEach(key => {
            node[key] = inputParameters[key];
        });

        var oneMinute = 60000;
        var precision = 0;

        var onOverride = -1;
        var offOverride = -1;

        var onOffsetOverride = -1; // DJL
        var offOffsetOverride = -1; // DJL

        var lonOverride = -1;
        var latOverride = -1;

        var stopped = 0;

        var awayMinutes = 0;
        var awayDisp = 0;
        var awayMod = "mins";

        var ismanual = -1;
        var timeout = 0;
        var startDone = 0;

        var onlyManual = 0;
        var goodDay = 0;

        var temporaryManual = 0;
        var permanentManual = 0;

        var playit = 0;
        var newEndTime = 0;

        var actualStartOffset = 0;
        var actualEndOffset = 0;

        var actualStartOffset2 = 0;
        var actualEndOffset2 = 0;

        var actualStartTime = 0;
        var actualEndTime = 0;
        var actualStartTime2 = 0;
        var actualEndTime2 = 0;

        var manualState = 0;
        var autoState = 0;
        var lastState = -1;
        var actualState = 0;

        var change = 0;

        var timer = setInterval(function () {
            node.emit("input", {});
        }, oneMinute); // trigger every 60 secs

        node.on("input", function (inputMessage) {
            let now = DateTime.local();
            if (node.tz) {
                now = now.setZone(node.tz);
            }
            const dayNow = now.day;
            const weekdayNow = now.weekday;
            // const hoursNow = now.hour;

            if (awayMinutes) {
                awayMinutes--;
            }

            if (awayMod == "mins") {
                awayDisp = 0;
                if (awayMinutes) {
                    awayMinutes--;
                }
            } else if (awayMod == "hrs") {
                awayDisp++;
                if (awayDisp >= 60) {
                    awayDisp = 0;
                    if (awayMinutes) {
                        awayMinutes--;
                    }
                }
            } else if (awayMod == "days") {
                awayDisp++;
                if (awayDisp >= 1440) {
                    awayDisp = 0;
                    if (awayMinutes) {
                        awayMinutes--;
                    }
                }
            }

            if ((lonOverride !== -1) && (latOverride !== -1)) {
                node.lon = lonOverride;
                node.lat = latOverride;
            } else {
                node.lon = inputParameters.lon;
                node.lat = inputParameters.lat;
            }

            // we're working on local time
            var sunTimes = SunCalc.getTimes(now, node.lat, node.lon); // get this from UTC, not local time
            var moonTimes = SunCalc.getMoonTimes(now, node.lat, node.lon); // moon up and down times - moons.rise, moons.set

            var dawn = minutesSinceMidnight(sunTimes.dawn, now.zone);
            var dusk = minutesSinceMidnight(sunTimes.dusk, now.zone);
            var solarNoon = minutesSinceMidnight(sunTimes.solarNoon, now.zone);
            var sunrise = minutesSinceMidnight(sunTimes.sunrise, now.zone);
            var sunset = minutesSinceMidnight(sunTimes.sunset, now.zone);

            var moonrise = minutesSinceMidnight(moonTimes.rise, now.zone, 1440);
            var moonset = minutesSinceMidnight(moonTimes.rise, now.zone, 0);
            var night = minutesSinceMidnight(sunTimes.night, now.zone);
            var nightEnd = minutesSinceMidnight(sunTimes.nightEnd, now.zone);

            var today = now.hour*60 + now.minute;
            var startTime = parseInt(node.startTime, 10);
            var endTime = parseInt(node.endTime, 10);
            var startTime2 = parseInt(node.startTime2, 10);
            var endTime2 = parseInt(node.endTime2, 10);

            var statusText = "";
            var outputMessage1 = {
                payload: "",
                topic: ""
            };
            var outputMessage2 = {
                payload: "",
                reference: node.outTopic + ":" + node.outPayload1 + ":" + node.outPayload2 + ":" + today,
                topic: "status",
                state: "",
                time: "",
                name: ""
            };
            var outputMessage3 = {
                payload: "",
                topic: ""
            };

            // autoState is 1 or 0 or would be on auto.... has anything changed...
            change = 0;
            if (actualStartOffset == 0) {
                if (node.random) {
                    actualStartOffset = randomInt(0, node.startOff);
                } else {
                    actualStartOffset = parseInt(node.startOff);
                }

                if (node.randon1) {
                    actualStartOffset = randomInt(0, node.startOff);
                }
            }

            if (actualEndOffset == 0) {
                if (node.random) {
                    actualEndOffset = randomInt(0, node.endOff);
                } else {
                    actualEndOffset = parseInt(node.endOff);
                }

                if (node.randoff1) {
                    actualEndOffset = randomInt(0, node.endOff);
                }
            }

            if (actualStartOffset2 == 0) {
                if (node.random) {
                    actualStartOffset2 = randomInt(0, node.startOff2);
                } else { 
                    actualStartOffset2 = parseInt(node.startOff2);
                }

                if (node.randon2) {
                    actualStartOffset2 = randomInt(0, node.startOff2);
                }
            }

            if (actualEndOffset2 == 0) {
                if (node.random) {
                    actualEndOffset2 = randomInt(0, node.endOff2);
                } else {
                    actualEndOffset2 = parseInt(node.endOff2);
                }
                if (node.randoff2) {
                    actualEndOffset2 = randomInt(0, node.endOff2);
                }
            }

            // manual override
            if ((inputMessage.payload == 1) || (inputMessage.payload === 0)) {
                inputMessage.payload = inputMessage.payload.toString();
            }

            if (inputMessage.payload > "") {
                inputMessage.payload = inputMessage.payload.toString().replace(/ +(?= )/g, '');
                var theSwitch = inputMessage.payload.toLowerCase().split(" ");

                switch (theSwitch[0]) {
                    case "geo_override": change = 1;
                        switch (theSwitch.length) {
                            case 3: lonOverride = Number(theSwitch[1]);
                                latOverride = Number(theSwitch[2]);
                                break;
                            default: lonOverride = -1;
                                latOverride = -1;
                                break;
                        }
                        break;

                    case "away":
                        if (typeof theSwitch[1] === 'undefined') {
                            awayMinutes = 0;
                        } else { 
                            awayMinutes = Number(theSwitch[1]);
                        }

                        if (typeof theSwitch[2] === 'undefined') {
                            awayMod = "mins";
                            awayDisp = 0;
                        } else if (theSwitch[2].toLowerCase().substr(0, 1) == 'h') {
                            awayMod = "hrs";
                            awayDisp = 0;
                        } else if (theSwitch[2].toLowerCase().substr(0, 1) == 'd') {
                            awayMod = "days";
                            awayDisp = 0;
                        } else {
                            awayMinutes = Number(theSwitch[1]);
                            awayDisp = 0;
                        }
                        awayMinutes++;
                        break;

                    case "sync": goodDay = 1;
                        change = 1;
                        break;

                    case "toggle":
                        if (actualState == 0) {
                            if (permanentManual == 0) {
                                temporaryManual = 1;
                            }
                            timeout = node.timeout;
                            change = 1;
                            manualState = 1;
                            stopped = 0;
                            goodDay = 1;
                        } else {
                            if (permanentManual == 0) {
                                temporaryManual = 1;
                            }
                            timeout = node.timeout;
                            change = 1;
                            manualState = 0;
                            stopped = 0;
                            goodDay = 1;
                        }
                        break;

                    case "on":
                    case 1:
                    case "1":
                        // bodge to kill timer
                        precision = 0;
                        oneMinute = 60000;
                        temporaryManual = 0;
                        clearInterval(timer);
                        timer = setInterval(function () {
                            node.emit("input", {});
                        }, oneMinute); // trigger every 60 secs
                        temporaryManual = 1;

                        if (permanentManual == 0) {
                            temporaryManual = 1;
                        }
                        timeout = node.timeout;
                        change = 1;
                        manualState = 1;
                        stopped = 0;
                        goodDay = 1;
                        break;

                    case "off":
                    case 0:
                    case "0":
                        // bodge to kill timer
                        precision = 0;
                        oneMinute = 60000;
                        temporaryManual = 0;
                        clearInterval(timer);
                        timer = setInterval(function () {
                            node.emit("input", {});
                        }, oneMinute); // trigger every 60 secs

                        if (permanentManual == 0) {
                            temporaryManual = 1;
                        }
                        timeout = node.timeout;
                        change = 1;
                        manualState = 0;
                        stopped = 0;
                        goodDay = 1;
                        break;

                    case "default":
                    case "auto":

                        // bodge to kill timer
                        precision = 0;
                        oneMinute = 60000;
                        temporaryManual = 0;
                        clearInterval(timer);
                        timer = setInterval(function () {
                            node.emit("input", {});
                        }, oneMinute); // trigger every 60 secs
                        temporaryManual = 0;
                        permanentManual = 0;
                        change = 1;
                        stopped = 0;
                        goodDay = 1;
                        precision = 0;
                        break;

                    case "manual":
                        if ((temporaryManual == 0)) {
                            manualState = autoState;
                            switch (theSwitch[1]) {
                                case 1:
                                case "1":
                                case "on": manualState = 1;
                                    break;
                                case 0:
                                case "0":
                                case "off": manualState = 0;
                                    break;
                            }
                        }
                        temporaryManual = 0;
                        permanentManual = 1;
                        change = 1;
                        stopped = 0;
                        break;

                    case "stop": stopped = 1;
                        change = 1;
                        manualState = 0;
                        permanentManual = 1;
                        break;

                    case "quiet": stopped = 1;
                        change = 0;
                        break;

                    case "on_override": change = 1;
                        switch (theSwitch.length) {
                            case 1: onOverride = -1;
                                break;
                            case 2:
                                var switch2 = theSwitch[1].split(":");
                                if (switch2.length == 2) {
                                    onOverride = (Number(switch2[0]) * 60) + Number(switch2[1]);
                                } else {
                                    switch (theSwitch[1]) {
                                        case 'dawn': onOverride = 5000;
                                            break;
                                        case 'dusk': onOverride = 5001;
                                            break;
                                        case 'solarnoon': onOverride = 5002;
                                            break;
                                        case 'sunrise': onOverride = 5003;
                                            break;
                                        case 'sunset': onOverride = 5004;
                                            break;
                                        case 'night': onOverride = 5005;
                                            break;
                                        case 'nightend': onOverride = 5006;
                                            break;
                                        case 'moonrise': onOverride = 5007;
                                            break;
                                        case 'moonset': onOverride = 5008;
                                            break;
                                        default: onOverride = Number(theSwitch[1]);
                                            break;
                                    }
                                }
                                break;
                            case 3: onOverride = (Number(theSwitch[1]) * 60) + Number(theSwitch[2]);
                                break;
                        }
                        break;

                    case "off_override": change = 1;
                        switch (theSwitch.length) {
                            case 1: offOverride = -1;
                                break;
                            case 2:
                                var switch2 = theSwitch[1].split(":");
                                if (switch2.length == 2) {
                                    offOverride = (Number(switch2[0]) * 60) + Number(switch2[1]);
                                } else {
                                    switch (theSwitch[1]) {
                                        case 'dawn': offOverride = 5000;
                                            break;
                                        case 'dusk': offOverride = 5001;
                                            break;
                                        case 'solarnoon': offOverride = 5002;
                                            break;
                                        case 'sunrise': offOverride = 5003;
                                            break;
                                        case 'sunset': offOverride = 5004;
                                            break;
                                        case 'night': offOverride = 5005;
                                            break;
                                        case 'nightend': offOverride = 5006;
                                            break;
                                        case 'moonrise': offOverride = 5007;
                                            break;
                                        case 'moonset': offOverride = 5008;
                                            break;
                                        default: offOverride = Number(theSwitch[1]);
                                            break;
                                    }
                                }
                                break;
                            case 3: offOverride = (Number(theSwitch[1]) * 60) + Number(theSwitch[2]);
                                break;
                        }
                        break;

                    case "on_offset_override": change = 1;
                        switch (theSwitch.length) { // DJL this case block
                            case 1: onOffsetOverride = -1;
                                break;
                            case 2:
                                var switch2 = theSwitch[1].split(":");
                                if (switch2.length == 2) {
                                    onOffsetOverride = (Number(switch2[0]) * 60) + Number(switch2[1]);
                                } else {
                                    switch (theSwitch[1]) {
                                        case 'dawn': onOffsetOverride = 5000;
                                            break;
                                        case 'dusk': onOffsetOverride = 5001;
                                            break;
                                        case 'solarnoon': onOffsetOverride = 5002;
                                            break;
                                        case 'sunrise': onOffsetOverride = 5003;
                                            break;
                                        case 'sunset': onOffsetOverride = 5004;
                                            break;
                                        case 'night': onOffsetOverride = 5005;
                                            break;
                                        case 'nightend': onOffsetOverride = 5006;
                                            break;
                                        case 'moonrise': onOffsetOverride = 5007;
                                            break;
                                        case 'moonset': onOffsetOverride = 5008;
                                            break;
                                        default: onOffsetOverride = Number(theSwitch[1]);
                                            break;
                                    }
                                }
                                break;
                            case 3: onOffsetOverride = (Number(theSwitch[1]) * 60) + Number(theSwitch[2]);
                                break;
                        }
                        break;

                    case "off_offset_override": change = 1;
                        switch (theSwitch.length) { // DJL this case block
                            case 1: offOffsetOverride = -1;
                                break;
                            case 2:
                                var switch2 = theSwitch[1].split(":");
                                if (switch2.length == 2) {
                                    offOffsetOverride = (Number(switch2[0]) * 60) + Number(switch2[1]);
                                } else {
                                    switch (theSwitch[1]) {
                                        case 'dawn': offOffsetOverride = 5000;
                                            break;
                                        case 'dusk': offOffsetOverride = 5001;
                                            break;
                                        case 'solarnoon': offOffsetOverride = 5002;
                                            break;
                                        case 'sunrise': offOffsetOverride = 5003;
                                            break;
                                        case 'sunset': offOffsetOverride = 5004;
                                            break;
                                        case 'night': offOffsetOverride = 5005;
                                            break;
                                        case 'nightend': offOffsetOverride = 5006;
                                            break;
                                        case 'moonrise': offOffsetOverride = 5007;
                                            break;
                                        case 'moonset': offOffsetOverride = 5008;
                                            break;
                                        default: offOffsetOverride = Number(theSwitch[1]);
                                            break;
                                    }
                                }
                                break;
                            case 3: offOffsetOverride = (Number(theSwitch[1]) * 60) + Number(theSwitch[2]);
                                break;
                        }
                        break;

                    case "timer": precision = Number(theSwitch[1]);
                        if (precision) {
                            oneMinute = 1000; // dec 2018
                            precision++;
                            if (theSwitch[2] > "") {
                                if (theSwitch[2].toLowerCase().substr(0, 1) == 'm') {
                                    oneMinute = 60000;
                                    precision *= 60;
                                }
                            }
                            if (permanentManual == 0) {
                                temporaryManual = 1;
                            }
                            timeout = node.timeout;
                            change = 1;
                            manualState = 1;
                            stopped = 0;
                            goodDay = 1;
                        } else {
                            oneMinute = 60000;
                            temporaryManual = 0; // permanentManual = 0; // apr 16 2018
                            change = 1;
                            stopped = 0;
                            goodDay = 1;
                        }
                        clearInterval(timer);
                        timer = setInterval(function () {
                            node.emit("input", {});
                        }, oneMinute); // trigger every 60 secs
                        break;

                    case "timeoff": precision = Number(theSwitch[1]);
                        if (precision) {
                            oneMinute = 1000; // dec 2018
                            precision++;
                            if (theSwitch[2] > "") {
                                if (theSwitch[2].toLowerCase().substr(0, 1) == 'm') {
                                    oneMinute = 60000;
                                    precision *= 60;
                                }
                            }
                            if (permanentManual == 0) {
                                temporaryManual = 1;
                            }
                            timeout = node.timeout;
                            change = 1;
                            manualState = 0;
                            stopped = 0;
                            goodDay = 1;
                        } else {
                            oneMinute = 60000;
                            temporaryManual = 0; // permanentManual = 0; // apr 16 2018
                            change = 1;
                            stopped = 0;
                            goodDay = 1;
                        }
                        clearInterval(timer);
                        timer = setInterval(function () {
                            node.emit("input", {});
                        }, oneMinute); // trigger every 60 secs
                        break;

                    default:
                        break;
                }
            }

            var thedot = "dot"
            if (onOverride != -1) {
                thedot = "ring";
                startTime = onOverride;
            }
            if (offOverride != -1) {
                thedot = "ring";
                endTime = offOverride;
            }
            if (onOffsetOverride != -1) {
                thedot = "ring";
                actualStartOffset = onOffsetOverride;
            } // DJL
            if (offOffsetOverride != -1) {
                thedot = "ring";
                actualEndOffset = offOffsetOverride;
            } // DJL


            switch (startTime) {
                case 5000:
                    startTime = dawn;
                    break;
                case 5001:
                    startTime = dusk;
                    break;
                case 5002:
                    startTime = solarNoon;
                    break;
                case 5003:
                    startTime = sunrise;
                    break;
                case 5004:
                    startTime = sunset;
                    break;
                case 5005:
                    startTime = night;
                    break;
                case 5006:
                    startTime = nightEnd;
                    break;
                case 5007: 
                    startTime = moonrise;
                    break;
                case 5008:
                    startTime = moonset;
                    break;
            }

            switch (endTime) {
                case 5000:
                    endTime = dawn;
                    break;
                case 5001:
                    endTime = dusk;
                    break;
                case 5002:
                    endTime = solarNoon;
                    break;
                case 5003:
                    endTime = sunrise;
                    break;
                case 5004:
                    endTime = sunset;
                    break;
                case 5005:
                    endTime = night;
                    break;
                case 5006:
                    endTime = nightEnd;
                    break;
                case 5007: 
                    endTime = moonrise;
                    break;
                case 5008:
                    endTime = moonset;
                    break;

                case 10001:
                    endTime = (startTime + 1) % 1440;
                    break;
                case 10002:
                    endTime = (startTime + 2) % 1440;
                    break;
                case 10005: 
                    endTime = (startTime + 5) % 1440;
                    break;
                case 10010: 
                    endTime = (startTime + 10) % 1440;
                    break;
                case 10015: 
                    endTime = (startTime + 15) % 1440;
                    break;
                case 10030: 
                    endTime = (startTime + 30) % 1440;
                    break;
                case 10060: 
                    endTime = (startTime + 60) % 1440;
                    break;
                case 10090: 
                    endTime = (startTime + 90) % 1440;
                    break;
                case 10120: 
                    endTime = (startTime + 120) % 1440;
                    break;
            }

            actualStartTime = (startTime + Number(actualStartOffset)) % 1440;
            actualEndTime = (endTime + Number(actualEndOffset)) % 1440;

            switch (startTime2) {
                case 5000:
                    startTime2 = dawn;
                    break;
                case 5001:
                    startTime2 = dusk;
                    break;
                case 5002:
                    startTime2 = solarNoon;
                    break;
                case 5003:
                    startTime2 = sunrise;
                    break;
                case 5004:
                    startTime2 = sunset;
                    break;
                case 5005:
                    startTime2 = night;
                    break;
                case 5006:
                    startTime2 = nightEnd;
                    break;
                case 5007: 
                    startTime2 = moonrise;
                    break;
                case 5008:
                    startTime2 = moonset;
                    break;
            }

            switch (endTime2) {
                case 5000:
                    endTime2 = dawn;
                    break;
                case 5001:
                    endTime2 = dusk;
                    break;
                case 5002:
                    endTime2 = solarNoon;
                    break;
                case 5003:
                    endTime2 = sunrise;
                    break;
                case 5004:
                    endTime2 = sunset;
                    break;
                case 5005:
                    endTime2 = night;
                    break;
                case 5006:
                    endTime2 = nightEnd;
                    break;
                case 5007: 
                    endTime2 = moonrise;
                    break;
                case 5008:
                    endTime2 = moonset;
                    break;

                case 10001:
                    endTime2 = (startTime2 + 1) % 1440;
                    break;
                case 10002:
                    endTime2 = (startTime2 + 2) % 1440;
                    break;
                case 10005: 
                    endTime2 = (startTime2 + 5) % 1440;
                    break;
                case 10010: 
                    endTime2 = (startTime2 + 10) % 1440;
                    break;
                case 10015: 
                    endTime2 = (startTime2 + 15) % 1440;
                    break;
                case 10030: 
                    endTime2 = (startTime2 + 30) % 1440;
                    break;
                case 10060: 
                    endTime2 = (startTime2 + 60) % 1440;
                    break;
                case 10090: 
                    endTime2 = (startTime2 + 90) % 1440;
                    break;
                case 10120: 
                    endTime2 = (startTime2 + 120) % 1440;
                    break;
            }

            actualStartTime2 = (startTime2 + Number(actualStartOffset2)) % 1440;
            actualEndTime2 = (endTime2 + Number(actualEndOffset2)) % 1440;

            autoState = 0;
            goodDay = 0;
            switch (weekdayNow) {
                case 0:
                case 7:
                    if (node.sun) { autoState = 1; }
                    break;
                case 1:
                    if (node.mon) { autoState = 1; }
                    break;
                case 2:
                    if (node.tue) { autoState = 1; }
                    break;
                case 3:
                    if (node.wed) { autoState = 1; }
                    break;
                case 4:
                    if (node.thu) { autoState = 1; }
                    break;
                case 5:
                    if (node.fri) { autoState = 1; }
                    break;
                case 6:
                    if (node.sat) { autoState = 1; }
                    break;
            }

            if (autoState) {
                autoState = 0;
                switch (now.month) {
                    case 0:
                        if (node.jan) { autoState = 1; }
                        break;
                    case 1:
                        if (node.feb) { autoState = 1; }
                        break;
                    case 2:
                        if (node.mar) { autoState = 1; }
                        break;
                    case 3:
                        if (node.apr) { autoState = 1; }
                        break;
                    case 4:
                        if (node.may) { autoState = 1; }
                        break;
                    case 5:
                        if (node.jun) { autoState = 1; }
                        break;
                    case 6:
                        if (node.jul) { autoState = 1; }
                        break;
                    case 7:
                        if (node.aug) { autoState = 1; }
                        break;
                    case 8:
                        if (node.sep) { autoState = 1; }
                        break;
                    case 9:
                        if (node.oct) { autoState = 1; }
                        break;
                    case 10:
                        if (node.nov) { autoState = 1; }
                        break;
                    case 11:
                        if (node.dec) { autoState = 1; }
                        break;
                }
            }

            if (
                ((node.day1 == dayNow) && (node.month1 == (now.month + 1))) ||
                ((node.day2 == dayNow) && (node.month2 == (now.month + 1))) ||
                ((node.day3 == dayNow) && (node.month3 == (now.month + 1))) ||
                ((node.day4 == dayNow) && (node.month4 == (now.month + 1))) ||
                ((node.day5 == dayNow) && (node.month5 == (now.month + 1))) ||
                ((node.day6 == dayNow) && (node.month6 == (now.month + 1))) ||
                ((node.day7 == dayNow) && (node.month7 == (now.month + 1))) ||
                ((node.day8 == dayNow) && (node.month8 == (now.month + 1))) ||
                ((node.day9 == dayNow) && (node.month9 == (now.month + 1))) ||
                ((node.day10 == dayNow) && (node.month10 == (now.month + 1))) ||
                ((node.day11 == dayNow) && (node.month11 == (now.month + 1))) ||
                ((node.day12 == dayNow) && (node.month12 == (now.month + 1))) ||
                (dayInMonth(now, node.d1, node.w1) == true) ||
                (dayInMonth(now, node.d2, node.w2) == true) ||
                (dayInMonth(now, node.d3, node.w3) == true) ||
                (dayInMonth(now, node.d4, node.w4) == true) ||
                (dayInMonth(now, node.d5, node.w5) == true) 
            ) {
                autoState = 1;
            }

            if (
                ((node.xday1 == dayNow) && (node.xmonth1 == (now.month + 1))) ||
                ((node.xday2 == dayNow) && (node.xmonth2 == (now.month + 1))) ||
                ((node.xday3 == dayNow) && (node.xmonth3 == (now.month + 1))) ||
                ((node.xday4 == dayNow) && (node.xmonth4 == (now.month + 1))) ||
                ((node.xday5 == dayNow) && (node.xmonth5 == (now.month + 1))) ||
                ((node.xday6 == dayNow) && (node.xmonth6 == (now.month + 1))) 
            ) {
                autoState = 0;
            }

            if (
                ((node.xday7 == dayNow) && (node.xmonth7 == (now.month + 1))) ||
                ((node.xday8 == dayNow) && (node.xmonth8 == (now.month + 1))) ||
                ((node.xday9 == dayNow) && (node.xmonth9 == (now.month + 1))) ||
                ((node.xday10 == dayNow) && (node.xmonth10 == (now.month + 1))) || 
                ((node.xday11 == dayNow) && (node.xmonth11 == (now.month + 1))) || 
                ((node.xday12 == dayNow) && (node.xmonth12 == (now.month + 1))) 
            ) {
                autoState = 1;
            }
            
            if (
                (dayInMonth(now, node.xd1, node.xw1) == true) ||
                (dayInMonth(now, node.xd2, node.xw2) == true) ||
                (dayInMonth(now, node.xd3, node.xw3) == true) ||
                (dayInMonth(now, node.xd4, node.xw4) == true) ||
                (dayInMonth(now, node.xd5, node.xw5) == true) ||
                (dayInMonth(now, node.xd6, node.xw6) == true) 
            ) {
                autoState = 0;
            }

            if (autoState) { // have to handle midnight wrap
                var wday;
                wday = dayNow & 1;
                if ((node.odd) && wday) {
                    autoState = 0;
                }

                if ((node.even) && !wday) {
                    autoState = 0;
                }

                if (autoState == 1) {
                    goodDay = 1;
                }
            }

            // if autoState==1 at this point - we are in the right day and right month or in a special day
            // now we check the time

            if (autoState) { // have to handle midnight wrap
                autoState = 0;
                if (actualStartTime <= actualEndTime) {
                    if ((today >= actualStartTime) && (today < actualEndTime)) {
                        autoState |= 1;
                    }
                } else { // right we are in an overlap situation
                    if (((today >= actualStartTime) || (today < actualEndTime))) {
                        autoState |= 1;
                    }
                }

                // added next line 17/02/2019 - suggestion from Mark McCans to overcome offset issue
                if (node.startTime2 != node.endTime2) {
                    if (actualStartTime2 <= actualEndTime2) {
                        if ((today >= actualStartTime2) && (today < actualEndTime2)) {
                            autoState |= 2;
                        }
                    } else { // right we are in an overlap situation
                        if (((today >= actualStartTime2) || (today < actualEndTime2))) {
                            autoState |= 2;
                        }
                    }
                }
            }

            if ((node.atStart == 0) && (startDone == 0)) {
                lastState = autoState;
            }

            // that is - no output at the start if node.atStart is not timered
            if (autoState != lastState) { // there's a change of auto
                lastState = autoState;
                change = 1; // make a change happen and kill temporary manual
                if (autoState) {
                    actualEndOffset = 0;
                    actualEndOffset2 = 0;
                } else {
                    actualStartOffset = 0;
                    actualStartOffset2 = 0;
                } // if turning on - reset offset for next OFF time else reset offset for next ON time
                temporaryManual = 0; // kill temporaryManual (but not permanentManual) as we've changed to next auto state
            }


            if (precision) {
                if (oneMinute == 1000) {
                    precision--;
                } else {
                    if (precision >= 60) {
                        precision -= 60;
                    }
                }
                if (precision == 0) {
                    clearInterval(timer);
                    oneMinute = 60000;
                    temporaryManual = 0;
                    permanentManual = 0;
                    change = 1;
                    stopped = 0;
                    goodDay = 1;
                    timer = setInterval(function () {
                        node.emit("input", {});
                    }, oneMinute); // trigger every 60 secs
                }
            }
            if (temporaryManual || permanentManual) { // auto does not time out.
                if (timeout && (permanentManual == 0)) {
                    if ((-- timeout) == 0) {
                        manualState = autoState; // turn the output to auto state after X minutes of any kind of manual operation
                        temporaryManual = 0;
                        // along with temporary manual setting
                        // permanentManual = 0; // april 16 2018
                        change = 1;
                    }
                }
            }

            if (temporaryManual || permanentManual) {
                actualState = manualState;
            } else { 
                actualState = autoState;
            }

            var duration = 0;
            var duration2 = 0;
            var manov = "";

            if (! goodDay == 1) {
                temporaryManual = 0;
            }

            // dec 16 2018
            if (permanentManual == 1) {
                manov = " Man. override. ";
            } else if (temporaryManual == 1) {
                if (precision) {
                    if (precision >= 60) { 
                        manov = " 'Timer' " + parseInt(precision / 60) + " mins left. ";
                    } else { 
                        manov = " 'Timer' " + precision + " secs left. ";
                    }
                } else {
                    manov = " Temp. override. ";
                }
            }
            if (node.suspend) {
                manov += " - SUSPENDED";
            }

            outputMessage2.name = node.name;
            outputMessage2.time = 0;

            if (actualState) {
                outputMessage2.state = "ON";
            } else { 
                outputMessage2.state = "OFF";
            }

            if (stopped == 0) {
                if (temporaryManual) {
                    outputMessage2.state += " Override";
                } else if (permanentManual) {
                    outputMessage2.state += " Manual";
                } else {
                    if (goodDay == 1) {
                        outputMessage2.state += " Auto";
                    }
                }
            } else {
                outputMessage2.state += " Stopped";
            }

            if ((permanentManual == 1) || (temporaryManual == 1) || (node.suspend)) { // so manual then
                if (actualState) {
                    if (stopped == 0) {
                        if (awayMinutes > 1) {
                            statusText = "Away " + (
                                (awayMinutes) - 1
                            ) + awayMod;
                        } else {
                            statusText = "ON" + manov;
                        }
                        node.status({fill: "green", shape: thedot, text: statusText});
                    } else {
                        if (awayMinutes > 1) {
                            statusText = "Away " + (
                                (awayMinutes) - 1
                            ) + awayMod;
                        } else {
                            statusText = "STOPPED" + manov;
                        }
                        node.status({ // stopped completely
                            fill: "black",
                            shape: thedot,
                            text: statusText
                        });
                    }
                } else {
                    if (stopped == 0) {
                        if (awayMinutes > 1) {
                            statusText = "Away " + (
                                (awayMinutes) - 1
                            ) + awayMod;
                        } else {
                            statusText = "OFF" + manov;
                        }
                        node.status({fill: "red", shape: thedot, text: statusText});
                    } else {
                        if (awayMinutes > 1) {
                            statusText = "Away " + (
                                (awayMinutes) - 1
                            ) + awayMod;
                        } else { 
                            statusText = "STOPPED" + manov;
                        }
                        node.status({ // stopped completely
                            fill: "black",
                            shape: thedot,
                            text: statusText
                        });
                    }
                }
            } else { // so not manual but auto....
                if (goodDay == 1) { // auto and today's the day
                    if (actualState) { // i.e. if turning on automatically
                        if (actualState & 1 === 1) {
                            if (today <= actualEndTime) {
                                duration = actualEndTime - today;
                            } else { 
                                duration = actualEndTime + (1440 - today);
                            }
                        }
                        if (actualState & 2 === 2) {
                            if (today <= actualEndTime2) {
                                duration2 = actualEndTime2 - today;
                            } else { 
                                duration2 = actualEndTime2 + (1440 - today);
                            }
                        }

                        outputMessage2.time = pad(parseInt(duration / 60), 2) + "hrs " + pad(duration % 60, 2) + "mins";
                        outputMessage2.time2 = pad(parseInt(duration2 / 60), 2) + "hrs " + pad(duration2 % 60, 2) + "mins";
                        if (stopped == 0) {
                            if (awayMinutes > 1) {
                                statusText = "Away " + (
                                    (awayMinutes) - 1
                                ) + awayMod;
                            } else { 
                                statusText = `ON for ${pad(parseInt(duration / 60), 2)}hrs ${pad(duration % 60, 2)}mins`; //Only for time1 ???\nON for ${pad(parseInt(duration2 / 60), 2)}hrs ${pad(duration2 % 60, 2)}mins`;
                            }
                            node.status({fill: "green", shape: thedot, text: statusText});
                        } else {
                            if (awayMinutes > 1) {
                                statusText = "Away " + (
                                    (awayMinutes) - 1
                                ) + "mins";
                            } else { 
                                statusText = "STOPPED" + manov;
                            }
                            node.status({ // stopped completely
                                fill: "black",
                                shape: thedot,
                                text: statusText
                            });
                        }
                    } else {
                        if ((node.startTime2 != node.endTime2) && (today > actualEndTime) && (today < actualEndTime2)) { // valid start and end 2 and we're past period 1
                            if ((today <= actualStartTime2)) {
                                duration2 = actualStartTime2 - today;
                            } else { 
                                duration2 = actualStartTime2 + (1440 - today);
                            }
                        } else {
                            if (today <= actualStartTime) {
                                duration = actualStartTime - today;
                            } else { 
                                duration = actualStartTime + (1440 - today);
                            }
                        } 
                        outputMessage2.time = pad(parseInt(duration / 60), 2) + "hrs " + pad(duration % 60, 2) + "mins" + manov;
                        outputMessage2.time2 = pad(parseInt(duration2 / 60), 2) + "hrs " + pad(duration2 % 60, 2) + "mins" + manov;
                        if (stopped == 0) {
                            if (awayMinutes > 1) {
                                statusText = "Away " + (
                                    (awayMinutes) - 1
                                ) + awayMod;
                            } else { 
                                statusText = "OFF for " + pad(parseInt(duration / 60), 2) + "hrs " + pad(duration % 60, 2) + "mins" + manov;
                            }
                            node.status({fill: "blue", shape: thedot, text: statusText});
                        } else {
                            if (awayMinutes > 1) {
                                statusText = "Away " + (
                                    (awayMinutes) - 1
                                ) + awayMod;
                            } else { 
                                statusText = "STOPPED" + manov;
                            }
                            node.status({ // stopped completely
                                fill: "black",
                                shape: thedot,
                                text: statusText
                            });
                        }
                    }
                } else {
                    outputMessage2.time = "";
                    if (stopped == 0) {
                        if (awayMinutes > 1) {
                            statusText = "Away " + (
                                (awayMinutes) - 1
                            ) + awayMod;
                        } else { 
                            statusText = "No action today" + manov;
                        }
                        node.status({ // auto and nothing today thanks
                            fill: "black",
                            shape: thedot,
                            text: statusText
                        });
                    } else {
                        if (awayMinutes > 1) {
                            statusText = "Away " + (
                                (awayMinutes) - 1
                            ) + awayMod;
                        } else { 
                            statusText = "STOPPED" + manov;
                        }
                        node.status({ // stopped completely
                            fill: "black",
                            shape: thedot,
                            text: statusText
                        });
                    }
                }
            } 

            outputMessage1.topic = node.outTopic;
            outputMessage3.payload = node.outText1;
            outputMessage3.topic = node.outTopic;

            if (temporaryManual || permanentManual) {
                outputMessage1.state = (actualState) ? "on" : "off";
            } else { 
                outputMessage1.state = "auto";
            }
            outputMessage1.value = actualState;

            if ((actualState) && (awayMinutes < 2)) {
                outputMessage1.payload = node.outPayload1;
                outputMessage3.payload = node.outText1;
            } else {
                outputMessage1.payload = node.outPayload2;
                outputMessage3.payload = node.outText2;
            }

            // take into account CHANGE variable - if true a manual or auto change is due

            outputMessage1.autoState = autoState;
            outputMessage1.manualState = manualState;
            outputMessage1.timeout = timeout;
            outputMessage1.temporaryManual = temporaryManual;
            outputMessage1.permanentManual = permanentManual;
            outputMessage1.now = today;
            outputMessage1.timer = precision;
            outputMessage1.duration = duration;
            outputMessage1.duration2 = duration2;
            outputMessage1.stamp = Date.now();
            outputMessage1.extState = statusText;

            if (awayMinutes) {
                outputMessage2.state = "AWAY";
            }

            outputMessage2.lon = node.lon;
            outputMessage2.lat = node.lat;
            outputMessage2.actualStartOffset = actualStartOffset;
            outputMessage2.actualEndOffset = actualEndOffset;
            outputMessage2.actualStartTime = actualStartTime;
            outputMessage2.actualEndTime = actualEndTime;
            outputMessage2.actualStartOffset2 = actualStartOffset2;
            outputMessage2.actualEndOffset2 = actualEndOffset2;
            outputMessage2.actualStartTime2 = actualStartTime2;
            outputMessage2.actualEndTime2 = actualEndTime2;
            outputMessage2.start = actualStartTime;
            outputMessage2.end = actualEndTime;
            outputMessage2.dusk = dusk;
            outputMessage2.dawn = dawn;
            outputMessage2.solarNoon = solarNoon;
            outputMessage2.sunrise = sunrise;
            outputMessage2.sunset = sunset;
            outputMessage2.night = night;
            outputMessage2.nightEnd = nightEnd;
            outputMessage2.moonrise = moonrise;
            outputMessage2.moonset = moonset;
            outputMessage2.now = today;
            outputMessage2.timer = precision;
            outputMessage2.duration = duration;
            outputMessage2.duration2 = duration2;
            outputMessage2.onOverride = onOverride;
            outputMessage2.offOverride = offOverride;
            outputMessage2.onOffsetOverride = onOffsetOverride;
            outputMessage2.offOffsetOverride = offOffsetOverride;
            outputMessage2.stamp = Date.now();
            outputMessage2.extState = statusText;
            outputMessage2.tz = now.zoneName;

            if (outputMessage2.state.substring(0, 2) === "ON") {
                outputMessage2.payload = actualState;
            } else {
                outputMessage2.payload = 0;
            }

            // jan 9, 2022
            if ((! node.suspend) && ((goodDay) || (permanentManual))) {
                const outputMessages = [];
                if ((change) || ((node.atStart) && (startDone == 0))) {
                    if ((outputMessage1.payload > "") && change) {
                        outputMessages.push(outputMessage1);
                    } else {
                        outputMessages.push(null);
                    }
                    outputMessages.push(outputMessage2);
                    if (stopped == 0) {
                        outputMessages.push(outputMessage3);
                    } else {
                        outputMessages.push(null);
                    }
                } else {
                    if (outputMessage1.payload > "" && node.repeat && stopped == 0) {
                        outputMessages.push(outputMessage1);
                    } else {
                        outputMessages.push(null);
                    }
                    outputMessages.push(outputMessage2);
                    outputMessages.push(null);
                }
                node.send(outputMessages);
            }
            startDone = 1;
        }); // end of the internal function

        setTimeout(function () {
            node.emit("input", {});
        }, 2000);
        // wait 2 secs before starting to let things settle down -
        // e.g. UI connect

        node.on("close", function () {
            if (timer) {
                clearInterval(timer);
            }
        });

    }
    RED.nodes.registerType("bigtimer", bigTimerNode);
}
