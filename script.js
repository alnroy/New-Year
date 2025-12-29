import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
const CONFIG = {
    // 8 Seconds for testing. Change to your date for production.
    // targetDate: new Date('January 1, 2026 00:00:00'), 
    targetDate: new Date('December 29, 2025 10:10:00'),
    
    santaSpeed: 10,         // Slow and majestic
    autoFireworks: true,
    fireworkChance: 0.03,  // Slightly more frequent
    
    // The Long Quote
    quoteText: "As the old year fades into history, let us welcome the new one with open hearts. May your journey be filled with starlight, your burdens be light, and your spirit soar higher than ever before."
};
// ==========================================
// 🎵 SINGLE AUDIO SETUP
// ==========================================
const newYearAudio = new Audio('celebration.mp3'); // Make sure this file exists!
newYearAudio.loop = true; // Set to false if you want it to play only once
let audioUnlocked = false;

// We must capture a user click to unlock audio.
// This new version checks if the party has ALREADY started when you click.
window.addEventListener('click', () => {
    if (!audioUnlocked) {
        // 1. Prepare volume
        newYearAudio.volume = 0; 
        
        // 2. Play to unlock
        newYearAudio.play().then(() => {
            audioUnlocked = true;
            
            // 3. DECISION: Should we keep playing or pause?
            if (newYearTriggered) {
                // If the timer is already zero, Turn it UP and KEEP PLAYING!
                newYearAudio.currentTime = 0;
                newYearAudio.volume = 1.0;
                console.log("Timer was already done. Playing music now!");
            } else {
                // If we are still counting down, pause and wait.
                newYearAudio.pause();
                newYearAudio.currentTime = 0;
                newYearAudio.volume = 1.0;
                console.log("Audio unlocked. Waiting for timer...");
            }
        }).catch(e => console.log("Audio unlock failed", e));
    }
}, { once: true });

const SOUNDS = {}; 
function playSound(name, volume) {
    return;
}
let audioEnabled = true; 
    

// ==========================================
// 🌌 SCENE
// ==========================================
const canvas = document.querySelector('#gl');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020210, 0.003);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.strength = 2.0; // Very dreamy glow
bloomPass.radius = 1.0;
composer.addPass(bloomPass);

// ==========================================
// 🌙 MOON & STARS
// ==========================================
const moonGeo = new THREE.SphereGeometry(4, 64, 64);
const moonMat = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vertexShaderMoon').textContent,
    fragmentShader: document.getElementById('fragmentShaderMoon').textContent
});
const moon = new THREE.Mesh(moonGeo, moonMat);
moon.position.set(-15, 15, -25);
moon.rotation.y = -0.6;
scene.add(moon);

const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ 
    map: new THREE.CanvasTexture(createGlowCanvas()), 
    transparent: true, blending: THREE.AdditiveBlending 
}));
moonGlow.scale.set(35, 35, 1);
moon.add(moonGlow);

function createGlowCanvas() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0, 'rgba(255,255,240,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
    return c;
}

const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(2000 * 3);
for(let i=0; i<2000; i++) {
    starPos[i*3]=(Math.random()-0.5)*200; starPos[i*3+1]=(Math.random()-0.5)*150+30; starPos[i*3+2]=(Math.random()-0.5)*100-50;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8 }));
scene.add(stars);

// ==========================================
// ✨ PARTICLES
// ==========================================
const particles = [];
const particleGeoBase = new THREE.SphereGeometry(1, 8, 8);

function createParticle(pos, color, type) {
    const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(particleGeoBase, mat);
    mesh.position.copy(pos);
    
    let vel = new THREE.Vector3();
    let life = 1.0; let decay = 0.02; let drag = 0.96; let gravity = 0.01; let scale = 0.1;

    if (type === 'explosion') {
        const theta = Math.random()*Math.PI*2; const phi = Math.acos((Math.random()*2)-1);
        const speed = Math.random()*0.8 + 0.2;
        vel.set(speed*Math.sin(phi)*Math.cos(theta), speed*Math.sin(phi)*Math.sin(theta), speed*Math.cos(phi));
        decay = 0.015; drag = 0.95; // High drag = smooth slow pop
        scale = Math.random()*0.15 + 0.05;
    } else if (type === 'tail' || type === 'santa') {
        vel.set((Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02, 0);
        decay = 0.03; drag = 0.98; gravity = 0; // Floating fluid
        scale = type === 'santa' ? (Math.random() * 0.6 + 0.2) : 0.08;
    } else if (type === 'reveal') {
        const angle = Math.random()*Math.PI*2; const speed = Math.random()*0.6;
        vel.set(Math.cos(angle)*speed, Math.sin(angle)*speed, (Math.random()-0.5));
        decay = 0.01; gravity = -0.005; scale = 0.2;
    }

    mesh.scale.setScalar(scale);
    scene.add(mesh);
    particles.push({ mesh, velocity: vel, life, decay, drag, gravity });
}

// ==========================================
// 🎆 FIREWORKS
// ==========================================
const fireworks = [];
class Firework {
    constructor(tx, ty) {
        this.ty = ty; 
        this.pos = new THREE.Vector3(tx, -40, 0);
        this.vel = new THREE.Vector3(0, 0.7 + Math.random()*0.3, 0);
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({color:0xffddaa}));
        this.mesh.position.copy(this.pos); 
        scene.add(this.mesh);
        this.exploded = false;
        
        // --- PLAY LAUNCH SOUND ---
        playSound('launch', 0.3); // Low volume for launch
    }

    update() {
        if(this.exploded) return;
        this.pos.add(this.vel); 
        this.mesh.position.copy(this.pos);
        if(Math.random()>0.5) createParticle(this.pos, 0xffaa00, 'tail');
        this.vel.y *= 0.98; 
        if(this.vel.y < 0.1 || this.pos.y >= this.ty) this.explode();
    }

    explode() {
        this.exploded = true; 
        scene.remove(this.mesh);
        
        // --- PLAY EXPLODE SOUND ---
        // Random volume between 0.4 and 0.8
        playSound('explode', 0.4 + Math.random() * 0.4);

        const col = new THREE.Color().setHSL(Math.random(), 1, 0.6);
        for(let i=0; i<150; i++) createParticle(this.pos, col, 'explosion');
    }
}
// ==========================================
// 🎅 BIG REALISTIC SANTA
// ==========================================
function createSantaTexture() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; 
    const ctx = c.getContext('2d');
    
    // Magical Silhouette Gradient
    const g = ctx.createLinearGradient(0,0,c.width,2);
    g.addColorStop(0.4,"#FFF"); g.addColorStop(0.5,"#FFD700"); g.addColorStop(1,"#FFF");
    
    ctx.shadowBlur = 40; ctx.shadowColor = "white";
    ctx.fillStyle = g;
    ctx.font = "300px serif"; 
    // Drawing huge high-res emoji composite
    ctx.fillText("", 100, 600);

    
    return new THREE.CanvasTexture(c);
}
const santa = new THREE.Sprite(new THREE.SpriteMaterial({ map: createSantaTexture(), transparent: true, opacity: 0 }));
// MASSIVE SCALE
santa.scale.set(30, 15, 1); 
santa.position.set(-60, 5, -10);
scene.add(santa);

let santaActive = false; let santaTimer = 0;

// ==========================================
// ⌨️ TYPEWRITER
// ==========================================
function startTypewriter() {
    const el = document.getElementById('typewriter-text');
    const text = CONFIG.quoteText;
    let i = 0;
    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 50); // Speed of typing
        } else {
            document.querySelector('.cursor').style.display = 'none'; // Hide cursor when done
        }
    }
    type();
}

// ==========================================
// ⏱️ LOGIC
// ==========================================
let newYearTriggered = false;

function triggerNewYear() {
    if (newYearTriggered) return; // Prevent double triggering
    newYearTriggered = true;
    
    // 1. PLAY THE AUDIO HERE
    if (audioUnlocked) {
        newYearAudio.volume = 1.0; // Force volume up
        newYearAudio.play().catch(e => console.log("Could not play audio", e));
    } else {
        console.log("Timer finished, but audio is locked! Waiting for user click...");
    }

    // [Rest of your particle/visual code stays exactly the same]
    for(let i=0; i<300; i++) createParticle(new THREE.Vector3(0,-5,0), 0xFFD700, 'reveal');
    document.getElementById('countdown-wrapper').style.opacity = 0;
    
    setTimeout(() => {
        document.getElementById('countdown-wrapper').style.display = 'none';
        const gw = document.getElementById('greeting-wrapper');
        gw.classList.remove('hidden');
        gw.classList.add('fade-in'); 
        setTimeout(startTypewriter, 1500);
    }, 800);

    setTimeout(() => { santaActive = true; }, 3000);
}

function animate() {
    requestAnimationFrame(animate);
    const now = new Date(); const diff = CONFIG.targetDate - now;

    if (diff <= 0) {
        if (!newYearTriggered) triggerNewYear();
        document.getElementById('countdown').innerText = "00:00:00";
    } else {
        const h = Math.floor(diff/3600000); const m = Math.floor((diff%3600000)/60000); const s = Math.floor((diff%60000)/1000);
        document.getElementById('countdown').innerText = `${h<10?'0'+h:h}:${m<10?'0'+m:m}:${s<10?'0'+s:s}`;
    }

    // Auto Fireworks
    if (newYearTriggered && CONFIG.autoFireworks && Math.random() < CONFIG.fireworkChance) {
        fireworks.push(new Firework((Math.random()-0.5)*60, Math.random()*15+5));
    }

    // Physics Update
    fireworks.forEach((f, i) => { f.update(); if(f.exploded) fireworks.splice(i,1); });
    
    for (let i = particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        p.velocity.y -= p.gravity;
        p.velocity.multiplyScalar(p.drag);
        p.mesh.position.add(p.velocity);
        p.mesh.scale.setScalar(p.life * p.mesh.scale.x/p.life);
        p.mesh.material.opacity = p.life;
        if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
    }

    // Santa Movement & Trail
    if (santaActive) {
        santaTimer += 0.003;
        santa.position.x = -60 + santaTimer * CONFIG.santaSpeed * 10;
        santa.position.y = Math.sin(santaTimer * 5) * 5 + 5;
        
        // Magic Trail (Gold & Ice Blue)
       // --- MASSIVE TRAIL UPDATE ---
        // Create 4 particles PER FRAME instead of just 1 occasionally
        for(let i=0; i<4; i++) {
             const tPos = santa.position.clone();
             
             // Offset to back of sleigh
             tPos.x -= 4; 
             tPos.y -= 2; 

             // Add Random Spread (Makes the trail thick/wide)
             tPos.x += (Math.random() - 0.5) * 2; 
             tPos.y += (Math.random() - 0.5) * 2; 
             
             // Random Color Mix (Gold, Blue, White)
             const rand = Math.random();
             let color = 0xFFD700; // Gold
             if(rand > 0.3) color = 0x88CCFF; // Ice Blue
             if(rand > 0.8) color = 0xFFFFFF; // White Sparkle

             createParticle(tPos, color, 'santa');
        }
        if(santa.position.x < -30) santa.material.opacity += 0.01;
        if(santa.position.x > 30) santa.material.opacity -= 0.01;
        if(santa.position.x > 80) santaActive = false;
    }

    stars.rotation.y += 0.0001; moon.rotation.y += 0.0003;
    composer.render();
}

// Interactions
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); const plane = new THREE.Plane(new THREE.Vector3(0,0,1),0);
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX/window.innerWidth)*2-1; mouse.y = -(e.clientY/window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse, camera); const t = new THREE.Vector3(); raycaster.ray.intersectPlane(plane, t);
    for(let i=0;i<3;i++) createParticle(t, 0xffaa00, 'tail');
});
window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera); const t = new THREE.Vector3(); raycaster.ray.intersectPlane(plane, t);
    fireworks.push(new Firework(t.x, t.y));
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});


animate();

