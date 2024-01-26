#!/usr/bin/env node
import React, {useState, useEffect} from 'react';
import { Box, Text, render } from 'ink';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import { exec } from 'child_process';
console.clear();
console.log('');
console.log('');
console.log('');
console.log('');
// This is the actual date.
const NEWYEAR = new Date(2024, 0, 1, 0, 0, 0, 0);

// This is a test date to play with.
// const NEWYEAR = new Date('December 31, 2023 19:18:00');

const LABEL_SEPARATOR = ' '.repeat(14);
const UNTIL_PADDING = ' '.repeat(20);
const FONTS = ['block', 'simpleBlock', '3d', 'simple3d', 'huge'];
const font = FONTS[Math.floor(Math.random() * FONTS.length)]
const { Component } = React;


const Happy = () => {
  const options = [
    'cristal',
    'teen',
    'mind',
    'morning',
    'vice',
    'passion',
    'fruit',
    'instagram',
    'atlas',
    'retro',
    'summer',
    'pastel',
    'rainbow'
  ];
  const [gradient, setGradient] = useState(options[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradient(options[Math.floor(Math.random() * options.length)]);
    }, 100);
    return () => clearInterval(interval);
  });

    return (
      <>
        <Gradient name={gradient}>
          <BigText text="HAPPY" align="center" />
          <BigText text="NEW YEAR" align="center"  />
        </Gradient>
        <Text bold> 🎉 Have a good holiday! 🎉</Text>
      </>
    );
  };

  function startAppleMusic() {
    // I will have to share the Playlist ( Apple ) that we made for 2024. We may update it for the next year.
    const command = `osascript -e 'tell application "Music" to play playlist "NY 2024"'`;
    exec(command, function callback(error, stdout, stderr) {});
  }

  let said = {};
  let finalCountDown = false;
  let oneHourNotice = false;
  let thirtyMinuteNotice = false;
  function sayWords(hours, minutes, seconds) {

    if(oneHourNotice == false && hours == 1 && minutes == 0 && seconds == 0) {
      oneHourNotice = true;
      const command = `say One Hours to New Year Count Down Begins.!`;
      exec(command, function callback(error, stdout, stderr) {});
    }

    if(thirtyMinuteNotice === false && hours == 0 && minutes == 20 && seconds == 0) {
      thirtyMinuteNotice = true;
      const command = `say 20 minutes to New Year Count Down Begins.!`;
      exec(command, function callback(error, stdout, stderr) {});
    }

    if(finalCountDown == false && hours == 0 && minutes == 6 && seconds == 0) {
      finalCountDown = true;
      // play the final countdown 
      // The file is _not_ in the repo. You'll need to add your own.
      const fileToPlay = '"./music/TheFinalCountdown.mp3"';
      const command = `afplay ${fileToPlay}`;
      exec(command, function callback(error, stdout, stderr) {});
    }

    const time = `${hours}:${minutes}:${seconds}`;

    if(!said[time] && hours == 0 && minutes == 0 && seconds == 30) {
      said[time] = time;
      const command = `say ${seconds} seconds to New Year Count Down Begins!`;
      exec(command, function callback(error, stdout, stderr) {});
    }

    if(!said[time] && hours == 0 && minutes == 0 && seconds <= 10 && seconds != 0) {
      said[time] = time;
      const command = `say ${seconds}`;
      exec(command, function callback(error, stdout, stderr) {});
    }

    if(!said[time] && hours == 0 && minutes == 0 && seconds == 0) {
      said[time] = time;
      const happyNewYear = 'Happy New Year!';
      const command = `say ${happyNewYear}`;
      exec(command, function callback(error, stdout, stderr) {});

      setTimeout(startAppleMusic, 1000);
    }
  }


class Countdown extends Component {
  constructor() {
    super();

    this.state = {
      time: new Date()
    };
  }

  render() {
    const epoch_diff = (NEWYEAR - this.state.time) / 1000;
    const hour = Math.floor(epoch_diff / 60 / 60);
    const minute = Math.floor((epoch_diff / 60) % 60);
    const second = Math.floor(epoch_diff % 60);

    const is_green = minute != 0 || hour != 0;

    if (epoch_diff <= 0) {
      clearInterval(this.timer);
      return <Happy/>
    }
    
    sayWords(hour.toString(), minute.toString(), second.toString());
    // const FONTS = ['block', 'simpleBlock', '3d', 'simple3d', 'huge'];
    return (
      <>
      <br />
      <br /><br /><br /><br />
        <Box>
        <br /><br /><br /><br /><br />
          <Text color={is_green ? "green" : "red"}>
            <BigText align="center" font="huge" text={`${hour.toString().padStart(2, '0')} ${minute.toString().padStart(2, '0')} ${second.toString().padStart(2, '0')}`}/>
          </Text>
          <br />
          <br /><br />
          <Text>
            <Spinner type="clock" /> Until <Text bold>{NEWYEAR.toDateString()}</Text>
          </Text>
        </Box>
      </>
    );
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({
        time: new Date()
      });
    }, 500);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }
}

render(<Countdown/>);
