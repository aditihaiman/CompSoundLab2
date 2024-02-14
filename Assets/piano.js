
document.addEventListener("DOMContentLoaded", function (event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    let num_osc = 0;
    let attackTime = 0.01;
    let releaseTime = 0.5;

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

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);

    globalAnalyser = audioCtx.createAnalyser();
    globalAnalyser.connect(audioCtx.destination);
    globalGain.connect(globalAnalyser);
    let maxAlltime = 0

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    $("#synth_type").on('change', selection);
    $("#LFO").on('change', LFO_select);
    $("#attack").on('change', update_attack);
    $("#release").on('change', update_release);


    


    activeOscillators = {};

    gainNodes = {};


    function keyDown(event) {
        synth_type = $("#synth_type").val();
        const key = (event.detail || event.which).toString();
        draw();

        //image filters
        let filter = 'hue-rotate(' + $("#mod_freq").val() + 'deg)' + 
                        'invert(' + $("#attack").val() + ')' + 
                        'contrast(' + $("#num_partials").val() + ')' + 
                        'sepia(' + $("#release").val() + ')' +
                        'saturate(' + $("#LFO_freq").val() + ')';

        $("#jumble").css({filter: filter});

        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            num_osc += 1;
            if (synth_type == 'additive') additive(key);
            else if(synth_type == "AM") AM(key);
            else FM(key);

            if($("#LFO").is(":checked")){
                LFO(key);
            }
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();

        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            for (let osc of activeOscillators[key]) {
                // console.log(osc);
                osc.gainNode.gain.setValueAtTime(osc.gainNode.gain.value, audioCtx.currentTime);
                osc.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + releaseTime);
                osc.stop(audioCtx.currentTime + releaseTime);
            }

            delete activeOscillators[key];
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
        osc_gain_node.gain.exponentialRampToValueAtTime(0.5 / num_osc, audioCtx.currentTime + 0.01);

        osc.start();
        activeOscillators[key] = osc;
        activeOscillators[key].gainNode = osc_gain_node;
        // console.log(gainNodes);
    }


    function additive(key) {
        let wavetype = $("#wave_type").val();
        const now = audioCtx.currentTime;
        let num_partials = $("#num_partials").val();
        
        console.log('additive');
        
        let oscs = []
        for(let i = 0; i < num_partials; i++){
            oscs.push(audioCtx.createOscillator());
        }
        
        for(let i = 0; i < oscs.length; i++){
            oscs[i].type = wavetype;
            oscs[i].frequency.value = keyboardFrequencyMap[key] * (i+1);
            if(i > 0) oscs[i].frequency.value += Math.random() * $("#additive_random").val();

            let osc_gain = audioCtx.createGain();
            oscs[i].gainNode = osc_gain;
            oscs[i].connect(osc_gain);
            osc_gain.connect(globalGain);
            oscs[i].start()

            osc_gain.gain.setValueAtTime(0, now);
            console.log(attackTime);
            osc_gain.gain.linearRampToValueAtTime(0.2 / num_osc, now + attackTime);
        }

        activeOscillators[key] = oscs;
    }

    function AM(key){
        let wavetype = $("#wave_type").val();
        let carrier = audioCtx.createOscillator();
        carrier.type = wavetype;
        let modulatorFreq = audioCtx.createOscillator();
        modulatorFreq.frequency.value = $("#mod_freq").val();
        carrier.frequency.value = keyboardFrequencyMap[key];
    
        const modulated = audioCtx.createGain();
        const depth = audioCtx.createGain();
        depth.gain.value = 0.25 / num_osc //scale modulator output to [-0.5, 0.5]
        modulated.gain.value = 0.5 / num_osc - depth.gain.value; //a fixed value of 0.5
        carrier.gainNode = modulated;
        modulatorFreq.gainNode = depth;
    
        modulatorFreq.connect(depth).connect(modulated.gain); //.connect is additive, so with [-0.5,0.5] and 0.5, the modulated signal now has output gain at [0,1]
        carrier.connect(modulated)
        modulated.connect(globalGain);
        
        carrier.start();
        modulatorFreq.start();

        activeOscillators[key] = [modulatorFreq, carrier];
    }

    function FM(key){
        let wavetype = $("#wave_type").val();
        let carrier = audioCtx.createOscillator();
        carrier.type = wavetype;
        let modulatorFreq = audioCtx.createOscillator();
    
        let modulationIndex = audioCtx.createGain();
        let carrier_gain = audioCtx.createGain();
        carrier_gain.gain.value = 0.5/num_osc;
        modulationIndex.gain.value = $("#index_mod").val();
        modulatorFreq.frequency.value = $("#mod_freq").val()
        carrier.frequency.value = keyboardFrequencyMap[key];
    
        modulatorFreq.connect(modulationIndex);
        modulationIndex.connect(carrier.frequency)
        
        carrier.connect(carrier_gain);
        carrier_gain.connect(globalGain);
        carrier.gainNode = carrier_gain;
        modulatorFreq.gainNode = modulationIndex;
    
        carrier.start();
        modulatorFreq.start();

        activeOscillators[key] = [modulatorFreq, carrier];
    }

    function LFO(key){
        let lfo = audioCtx.createOscillator();
        lfo.frequency.value = $("#LFO_freq").val();
        lfoGain = audioCtx.createGain();
        lfoGain.gain.value = $("#LFO_gain").val();
        lfo.connect(lfoGain).connect(activeOscillators[key][0].frequency);
        lfo.start();

        lfo.gainNode = lfoGain;
        activeOscillators[key].push(lfo);
    }
    
    function selection(){
        if($("#synth_type").val() == 'additive'){
            $("#AMFM_row").removeClass('highlight');
            $("#additive_row").addClass('highlight');
        }
        else{
            $("#AMFM_row").addClass('highlight');
            $("#additive_row").removeClass('highlight');
        }
    }

    function LFO_select(){
        if($("#LFO").is(':checked')){
            $("#LFO_row").addClass('highlight');
            $("#jumble").addClass('invert-color')
        }
        else {
            $("#LFO_row").removeClass('highlight');
            $("#jumble").removeClass('invert-color')
        }
    }

    function update_attack(){
        attackTime = Number($("#attack").val());
    }

    function update_release(){
        releaseTime = Number($("#release").val());
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



});




