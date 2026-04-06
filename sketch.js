const WIDTH = 800;
const HEIGHT = 800;

// 1D Slider configuration
const SLIDERS_CONFIG = {
    speed: { min: 0.0, max: 5, step: 0.1, initial: 1.0, label: "Speed: " }
};

// 2D Control configuration
const CONTROLS_2D_CONFIG = {
    amplitude: {
        label: "Amplitude",
        minX: -0.2, maxX: 0.2, initialX: 0.05,
        minY: -0.2, maxY: 0.2, initialY: 0.05
    },
    frequency: {
        label: "Frequency",
        minX: -100.0, maxX: 100.0, initialX: 10.0,
        minY: -100.0, maxY: 100.0, initialY: 10.0
    }
};

let img;

let sliders = {};
let sliderLabels = {};
let controls2D = {};

let liquidShader;

let shaderTime = 0;

let liquidShaderSrc = `
precision lowp float;

uniform sampler2D tex0;

uniform float time;
uniform float amplitudeX;
uniform float frequencyX;
uniform float amplitudeY;
uniform float frequencyY;

varying vec2 vTexCoord;

void main() {
// Offset the input coordinate
vec2 warpedCoord = vTexCoord;
warpedCoord.x += amplitudeX * sin(vTexCoord.y * frequencyX + time);
warpedCoord.y += amplitudeY * sin(vTexCoord.x * frequencyY + time);

// Set the new color by looking up the warped coordinate
gl_FragColor = texture2D(tex0, warpedCoord);
}
`;

async function setup() {
    img = await loadImage('/assets/logo.png');

    const container = document.getElementById('canvas-container');
    const canvas = createCanvas(WIDTH, HEIGHT, WEBGL);
    canvas.parent(container);

    createControlPanel();

    liquidShader = createFilterShader(liquidShaderSrc);
}

function draw() {
    background(20);
    
    push();
    imageMode(CENTER);
    image(img, 0, 0, WIDTH, HEIGHT, 0, 0, img.width, img.height, COVER);
    pop();

    shaderTime += sliders['speed'].value * 0.05;

    // Pass the time from p5 to the shader
    liquidShader.setUniform('time', shaderTime);
    liquidShader.setUniform('amplitudeX', controls2D['amplitude'].x);
    liquidShader.setUniform('frequencyX', controls2D['frequency'].x);
    liquidShader.setUniform('amplitudeY', controls2D['amplitude'].y);
    liquidShader.setUniform('frequencyY', controls2D['frequency'].y);

    filter(liquidShader);

    // Display current slider values
    fill(255);
    textSize(16);
    text(`Speed: ${sliders['speed'].value}`, 20, 20);
}

function createControlPanel() {
    const controlsContainer = document.getElementById('controls-container');

    // Create 1D sliders
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

    // Create 2D controls
    for (const [key, config] of Object.entries(CONTROLS_2D_CONFIG)) {
        create2DControl(controlsContainer, key, config);
    }
}

function create2DControl(container, name, config) {
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'control-2d-wrapper';
    wrapper.style.marginBottom = '20px';

    // Create label
    const label = document.createElement('label');
    label.textContent = config.label;
    label.className = 'control-2d-label';
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.style.fontWeight = 'bold';

    // Create pad container
    const padContainer = document.createElement('div');
    padContainer.className = 'control-2d-pad';
    padContainer.style.width = '150px';
    padContainer.style.height = '150px';
    padContainer.style.backgroundColor = '#2a2a2a';
    padContainer.style.borderRadius = '12px';
    padContainer.style.border = '2px solid #555';
    padContainer.style.position = 'relative';
    padContainer.style.cursor = 'crosshair';
    padContainer.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';

    // Create thumb
    const thumb = document.createElement('div');
    thumb.className = 'control-2d-thumb';
    thumb.style.width = '12px';
    thumb.style.height = '12px';
    thumb.style.backgroundColor = '#ff6b6b';
    thumb.style.borderRadius = '50%';
    thumb.style.position = 'absolute';
    thumb.style.top = '50%';
    thumb.style.left = '50%';
    thumb.style.transform = 'translate(-50%, -50%)';
    thumb.style.cursor = 'grab';
    thumb.style.boxShadow = '0 0 8px rgba(255, 107, 107, 0.6)';
    thumb.style.zIndex = '10';

    // Create value displays
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'control-2d-values';
    valueDisplay.style.marginTop = '8px';
    valueDisplay.style.fontSize = '12px';
    valueDisplay.style.color = '#ccc';

    // Initialize with middle values
    const xValue = (config.minX + config.maxX) / 2 * (config.initialX / ((config.minX + config.maxX) / 2));
    const yValue = (config.minY + config.maxY) / 2 * (config.initialY / ((config.minY + config.maxY) / 2));

    // Store actual values
    const controlState = {
        x: config.initialX,
        y: config.initialY
    };

    // Update display
    const updateDisplay = () => {
        const xPercent = ((controlState.x - config.minX) / (config.maxX - config.minX)) * 100;
        const yPercent = ((controlState.y - config.minY) / (config.maxY - config.minY)) * 100;
        
        thumb.style.left = xPercent + '%';
        thumb.style.top = (100 - yPercent) + '%';
        thumb.style.transform = 'translate(-50%, -50%)';
        
        valueDisplay.textContent = `X: ${controlState.x.toFixed(2)} Y: ${controlState.y.toFixed(2)}`;
    };

    // Position initial thumb
    updateDisplay();

    // Mouse and touch event handling
    let isActive = false;

    const handleStart = () => {
        isActive = true;
        thumb.style.cursor = 'grabbing';
    };

    const handleEnd = () => {
        isActive = false;
        thumb.style.cursor = 'grab';
    };

    const handleMove = (e) => {
        if (!isActive) return;

        const rect = padContainer.getBoundingClientRect();
        const x = e.clientX || e.touches?.[0].clientX;
        const y = e.clientY || e.touches?.[0].clientY;

        const relX = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        const relY = Math.max(0, Math.min(1, 1 - (y - rect.top) / rect.height));

        controlState.x = config.minX + relX * (config.maxX - config.minX);
        controlState.y = config.minY + relY * (config.maxY - config.minY);

        updateDisplay();
    };

    // Mouse events
    thumb.addEventListener('mousedown', handleStart);
    padContainer.addEventListener('mousedown', (e) => {
        handleStart();
        handleMove(e);
    });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('mousemove', handleMove);

    // Touch events
    thumb.addEventListener('touchstart', handleStart);
    padContainer.addEventListener('touchstart', (e) => {
        handleStart();
        handleMove(e);
    });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchmove', handleMove);

    padContainer.appendChild(thumb);
    wrapper.appendChild(label);
    wrapper.appendChild(padContainer);
    wrapper.appendChild(valueDisplay);
    container.appendChild(wrapper);

    controls2D[name] = controlState;
}

// // p5 wrapper for slider creation (alternative approach)
// function createSlider(name, config) {
//     let slider = createSlider(config.min, config.max, (config.min + config.max) / 2, config.step);
//     slider.style('width', '150px');
//     return slider;
// }
