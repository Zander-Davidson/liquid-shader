const WIDTH = 800;
const HEIGHT = 800;

// Slider configuration
const SLIDERS_CONFIG = {
    speed: { min: 0.1, max: 5, step: 0.1, initial: 1.0, label: "Speed: " },
    amplitude: { min: 0.01, max: 0.2, step: 0.005, initial: 0.05, label: "Amplitude: " },
    frequency: { min: 0.0, max: 100.0, step: 1.0, initial: 10.0, label: "Frequency: " }
};

let sliders = {};
let sliderLabels = {};

let video;
let liquidShader;

let shaderTime = 0;

let liquidShaderSrc = `
precision highp float;

uniform sampler2D tex0;

uniform float time;
uniform float amplitude;
uniform float frequency;

varying vec2 vTexCoord;

void main() {
// Offset the input coordinate
vec2 warpedCoord = vTexCoord;
warpedCoord.x += amplitude * sin(vTexCoord.y * frequency + time);
warpedCoord.y += amplitude * sin(vTexCoord.x * frequency + time);

// Set the new color by looking up the warped coordinate
gl_FragColor = texture2D(tex0, warpedCoord);
}
`;

function setup() {
    const container = document.getElementById('canvas-container');
    const canvas = createCanvas(WIDTH, HEIGHT, WEBGL);
    canvas.parent(container);

    createControlPanel();

    video = createVideo(
        'https://upload.wikimedia.org/wikipedia/commons/d/d2/DiagonalCrosswalkYongeDundas.webm'
    );
    video.volume(0);
    video.hide();
    video.loop();

    liquidShader = createFilterShader(liquidShaderSrc);

    describe('A warped video of a city crosswalk');
}

function draw() {
    background(20);
    
    push();
    imageMode(CENTER);
    image(video, 0, 0, WIDTH, HEIGHT, 0, 0, video.width, video.height, COVER);
    pop();

    shaderTime += sliders['speed'].value * 0.05;

    // Pass the time from p5 to the shader
    liquidShader.setUniform('time', shaderTime);
    liquidShader.setUniform('amplitude', sliders['amplitude'].value);
    liquidShader.setUniform('frequency', sliders['frequency'].value);

    filter(liquidShader);

    // Display current slider values
    fill(255);
    textSize(16);
    text(`Speed: ${sliders['speed'].value}`, 20, 20);
    text(`Amplitude: ${sliders['amplitude'].value}`, 20, 40);
    text(`Frequency: ${sliders['frequency'].value}`, 20, 60);
}

function createControlPanel() {
    const controlsContainer = document.getElementById('controls-container');

    for (const [key, config] of Object.entries(SLIDERS_CONFIG)) {
        // Wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'slider-wrapper';

        // Label
        const label = document.createElement('label');
        label.textContent = config.label;
        label.className = 'slider-label';

        // Slider input
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = config.initial;
        slider.className = 'slider';

        // Value display
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'slider-value';
        valueDisplay.textContent = parseFloat(slider.value).toFixed(1);

        slider.addEventListener('input', () => {
            valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(slider);
        wrapper.appendChild(valueDisplay);
        controlsContainer.appendChild(wrapper);

        // Store reference to slider
        sliders[key] = slider;
        sliderLabels[key] = label;
    }
}

// // p5 wrapper for slider creation (alternative approach)
// function createSlider(name, config) {
//     let slider = createSlider(config.min, config.max, (config.min + config.max) / 2, config.step);
//     slider.style('width', '150px');
//     return slider;
// }
