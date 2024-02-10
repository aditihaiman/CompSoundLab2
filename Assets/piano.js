
document.addEventListener("DOMContentLoaded", function (event) {

    

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    let num_osc = 0;

    // audioCtx.resume();

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);

    globalAnalyser = audioCtx.createAnalyser();
    globalAnalyser.connect(audioCtx.destination);
    globalGain.connect(globalAnalyser);
    let maxAlltime = 0

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);


    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    };

    const birds = {};

    setup_birds();

    activeOscillators = {};

    gainNodes = {};


    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        draw();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            num_osc += 1;
            playNote(key);
            show_bird(key);
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            activeOscillators[key].gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.5);
            activeOscillators[key].stop(audioCtx.currentTime+0.5);
            delete activeOscillators[key];
            // delete gainNodes[key];
            num_osc -= 1;
        }
    }

    function playNote(key) {
        const osc = audioCtx.createOscillator();
        osc_gain_node = audioCtx.createGain();

        osc.connect(osc_gain_node);
        osc_gain_node.connect(globalGain);

        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
        let wavetype = document.getElementById("wave_type").value;
        osc.type = wavetype; //choose your favorite waveform

        osc_gain_node.gain.setValueAtTime(0, audioCtx.currentTime);
        osc_gain_node.gain.exponentialRampToValueAtTime(0.5/num_osc, audioCtx.currentTime+0.01);

        osc.start();
        activeOscillators[key] = osc;
        activeOscillators[key].gainNode = osc_gain_node;
        // console.log(gainNodes);
    }

    
    function draw() {
        globalAnalyser.fftSize = 2048;
        var bufferLength = globalAnalyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        globalAnalyser.getByteTimeDomainData(dataArray);

        //values range 0-255, over the range -1,1, so we find the max value from a frame, and then scale
        var maxValue = (dataArray.reduce((max, curr) => (curr > max ? curr : max)) - 128) / 127.0;
        // console.log(maxValue);
        if (maxValue > maxAlltime){
            maxAlltime = maxValue;
            console.log("New record! -> " + maxAlltime);
        }
        
        requestAnimationFrame(draw);

    }

    function setup_birds(){

        let idx = 1;
        for (let key of Object.keys(keyboardFrequencyMap)){
            let bird = document.createElement('div');
            document.body.appendChild(bird);
            bird.id = "bird" + idx;

            let top = Math.floor((Math.random() * ($(window).height()/2)) + 1);
            let left = Math.floor((Math.random() * ($(window).width()/2)) + 1);

            $("#bird"+idx).css({
                'position': 'absolute',
                'top': top,
                'left': left,
                "background-image": 'url(\"./Assets/Birb/birb' + idx + '.png\")',
                'width': '100px',
                'height': '100px',
                'background-size': 'contain',
                'background-repeat': 'no-repeat',
                'opacity': 0
            });

            birds[key] = bird;
            idx+=1;
        }
        // console.log(birds);
    }

    function show_bird(key){
        let bird = birds[key].id;

        let top = Math.floor((Math.random() * ($(window).height()/2)) + 1);
        let left = Math.floor((Math.random() * ($(window).width()/2)) + 1);


        $("#" + bird).css({
            "top": top,
            "left": left,
            'opacity': 1
        });

        $("#" + bird).animate({'opacity': 0}, {
            duration: 3000,
            complete: function () {
                $("#" + bird).css({
                    'opacity': 0
                });
            }
        });
    }



});




