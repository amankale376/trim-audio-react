import WaveSurfer from 'wavesurfer.js';
import React, { useRef, useState } from 'react';
import './App.css';
import lamejs from 'lamejs';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

// use exact same module version as lamejs and Wavesurfer shows issues realted to pcm data. 
//Error: Mpeg not set. this error shows in newest version of lamejs

function App() {
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [playing, setPlaying] = useState(false);
  const waveformRef = useRef(null);
  function playAudio(){
    if(!playing){
      waveSurfer.play();
      setPlaying(true);
    }else{
      waveSurfer.pause();
      setPlaying(false);
    }
   
  }

React.useEffect(()=>{
  if (!waveSurfer) {
    const options = {
      container: waveformRef.current,
      waveColor: 'gray',
      progressColor: 'orange',
      cursorColor: 'black',
      barWidth: 2,
      barHeight: 1,
      barGap: null,
      responsive: true,
      height: 150,
      plugins: [
        RegionsPlugin.create({
          regionsMinLength: 0.1,
          // limitRegions: true,
          dragSelection: {
            slop: 5,
          },
        }),
      ],
    };
    const ws = WaveSurfer.create(options);
    setWaveSurfer(ws);
    // Add event listener inside the 'wavesurfer-ready' event

    const addRegionRestriction = () => {
      if (ws.regions.list.length >= 1) {
        const lastRegion = ws.regions.list[ws.regions.list.length - 1];
        console.log({lastRegion});
        ws.regions.list.forEach(region => {
          if (region.id !== lastRegion.id) {
            ws.regions.list.splice(ws.regions.list.indexOf(region), 1);
            console.log('region removing')
            region.remove();
          }
        });
      }
    };
    ws.on('region-created', addRegionRestriction);
    
  }else{
    waveSurfer.on('region-created', function (region) {
      console.log(region);
      region.on('click', function () {
        region.play();
      });
      // waveSurfer.enableDragSelection(false);
    });
  }
},[waveSurfer]);
React.useEffect(() => {
  if (waveSurfer && audioFile) {
    waveSurfer.loadBlob(audioFile);
  }
}, [waveSurfer, audioFile]);

function addFakeRegion(){
  const region = waveSurfer.addRegion({
    start: 1,
    end: 3,
    color: 'rgba(255, 0, 0, 0.3)',
    drag: true,
    resize: true,
    loop: false
  });
  console.log(region);
}
function cutRegion() {
  console.log(waveSurfer.regions,'regions');
  for (const id in waveSurfer.regions.list) {
    const region = waveSurfer.regions.list[id];
    region.play();
      break; // Exit loop after first active region is found
    
  }
}

async function downloadRegion() {
  const region = waveSurfer.regions.list[Object.keys(waveSurfer.regions.list)[0]];
  if (region) {
    const start = region.start;
    const end = region.end;
    const sampleRate = waveSurfer.backend.ac.sampleRate;
        const startIndex = Math.floor(start * sampleRate);
    const endIndex = Math.ceil(end * sampleRate);
    const buffer = await waveSurfer.backend.buffer;
    const clippedBuffer = buffer.getChannelData(0).subarray(startIndex, endIndex);
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    let mp3Data = [];
    const samples = clippedBuffer.length;
    for (let i = 0; i < samples; i++) {
      const sample = clippedBuffer[i] * 32767;
      mp3Data.push(mp3encoder.encodeBuffer(new Int16Array([sample])));
    }
    mp3Data.push(mp3encoder.flush());
    const blob = new Blob(mp3Data, {type: 'audio/mp3'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected_region.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    console.log('No region selected');
  }
}
  return (
    <div className="App">
  <div>
      <input type="file" onChange={(e) => setAudioFile(e.target.files[0])} />
      <div ref={waveformRef}></div>
    </div>
    <div>
    <button type='button' onClick={playAudio} >Play</button>
      <button onClick={cutRegion}>Cut Region</button>
      <button onClick={addFakeRegion}>Fake Region</button>
      <button onClick={downloadRegion}>Download Region</button>
    </div>
    </div>
  );
}

export default App;
