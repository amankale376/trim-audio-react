import WaveSurfer from 'wavesurfer.js';
import React, { useRef, useState } from 'react';
import './App.css';
import lamejs from 'lamejs';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
// use exact same module version as lamejs and Wavesurfer shows issues realted to pcm data. 
//Error: Mpeg not set. this error shows in newest version of lamejs

function App() {
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [regionPlaying, setRegionPlaying] = useState(false);
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
      waveColor: 'black',
      progressColor: 'grey',
      cursorColor: 'white',
      barWidth: 2,
      barHeight: 1,
      barGap: null,
      responsive: true,
      height: 150,
      plugins: [
        RegionsPlugin.create({
          limitRegions: true,
          dragSelection: {
            slop: 5,
          },
          drag: true,
          resize: true,
          maxLength: 20,
          minLength: 5
        }),
      ],
    };
    const ws = WaveSurfer.create(options);
    setWaveSurfer(ws);
    
  }else{
    waveSurfer.on('region-created', function (region) {
      console.log(region,'region-created');
      waveSurfer.clearRegions()
    });

    waveSurfer.on('region-updated', function (region) {
      console.log(region,'region-updated');
      playRegion(true);
    });
  }
},[waveSurfer]);
React.useEffect(() => {
  if (waveSurfer && audioFile) {
    waveSurfer.loadBlob(audioFile);
    addFakeRegion();
  }
}, [waveSurfer, audioFile]);

function addFakeRegion(){
  const region = waveSurfer.addRegion({
    start: 10,
    end: 30,
    color: 'rgba(255, 0, 0, 0.3)',
    drag: true,
    resize: true,
    loop: false,
    maxLength: 20,
    minLength: 5
  });
  console.log(region);
}
function playRegion(regionAdjust = false) {
  for (const id in waveSurfer.regions.list) {
    const region = waveSurfer.regions.list[id];
    console.log({regionPlaying});
    if(!regionPlaying){
      region.playLoop();
      setRegionPlaying(true);
    }else if(regionPlaying){
      waveSurfer.pause();
      setRegionPlaying(false);
    } else if(regionAdjust){
      region.playLoop();
    }
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
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 320);
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
    link.download = 'export-trimmed-audio.mp3';
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
      <button onClick={playRegion}>Play Region</button>
      <button onClick={addFakeRegion}>Fake Region</button>
      <button onClick={downloadRegion}>Download Region</button>
    </div>
    </div>
  );
}

export default App;
