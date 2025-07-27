/*
Advanced Starship Control Panel 2.0 — p5.js
Author: You + a helpful AI
Paste into editor.p5js.org and run.

Controls:
  W — Toggle WARP
  S — Toggle SHIELDS
  A — Toggle AUTONAV
  D — Toggle STEALTH
  Space — Send a RADAR ping
  T — Focus command terminal
  ESC — Exit terminal mode
  Mouse:
    • Click anywhere: spawn energy ripple
    • Drag on the core ring: adjust THROTTLE
    • Drag on hologram: rotate projection
    • Hover over toggles/buttons for info

Voice commands in terminal: help, scan, status, warp [on/off], 
shields [on/off], autonav [on/off], stealth [on/off], 
set course [number], divert power [system], full report
*/

let CTRL = {
    warp: false,
    shields: true,
    autonav: false,
    stealth: false,
    throttle: 0.42,   // 0..1
    alertLevel: 0,    // 0=normal, 1=yellow, 2=red
    anomalyDetected: false,
    powerAllocation: { engines: 0.3, shields: 0.3, sensors: 0.2, weapons: 0.2 },
    shipIntegrity: 1.0,
    systemStatus: { engines: "NOMINAL", shields: "ONLINE", sensors: "ACTIVE", weapons: "STANDBY" }
};

let THEME, starfield, radar, core, grid, spectrum, glyphs, pings = [];
let holo3d, terminal, sounds = {};
let t = 0; // global time
let seed;
let hoverInfo = '';
let lastPing = 0;
let parallaxOffset = { x: 0, y: 0 };
let terminalMode = false;

function preload() {
    // Simulate loading sounds - in p5.js editor you would use loadSound()
    sounds.beep = { play: () => { } };
    sounds.warp = { play: () => { } };
    sounds.shield = { play: () => { } };
    sounds.ping = { play: () => { } };
    sounds.alert = { play: () => { } };
    sounds.click = { play: () => { } };
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(displayDensity());
    colorMode(HSB, 360, 100, 100, 100);
    noCursor();
    seed = (Date.now() % 1000000) | 0;
    randomSeed(seed); noiseSeed(seed);

    THEME = {
        bg0: color(230, 30, 4, 100),
        bg1: color(220, 30, 8, 100),
        neonCyan: color(182, 85, 95, 100),
        neonMagenta: color(315, 85, 95, 100),
        neonAmber: color(34, 90, 100, 100),
        neonLime: color(90, 80, 100, 100),
        neonRed: color(0, 90, 100, 100),
        neonBlue: color(210, 80, 100, 100),
        grid: color(200, 20, 45, 100),
        panel: color(210, 20, 18, 100),
        white: color(0, 0, 100, 100),
        alert: [
            color(182, 85, 95, 100), // normal - cyan
            color(34, 90, 100, 100), // yellow alert
            color(0, 90, 100, 100)   // red alert
        ]
    };

    starfield = new Starfield(600);
    radar = new Radar();
    core = new QuantumCore();
    grid = new SignalGrid(16, 9);
    spectrum = new Spectrum();
    glyphs = new GlyphTape(3);
    holo3d = new Hologram();
    terminal = new Terminal();

    textFont('monospace');

    // Schedule random system events
    setInterval(randomSystemEvent, 20000);
}

function randomSystemEvent() {
    if (random() < 0.3) return; // 30% chance of no event

    let eventType = random(['anomaly', 'fluctuation', 'alert']);
    switch (eventType) {
        case 'anomaly':
            CTRL.anomalyDetected = true;
            let anomalyDuration = random(5000, 15000);
            setTimeout(() => { CTRL.anomalyDetected = false; }, anomalyDuration);
            terminal.addMessage("SYSTEM: Quantum anomaly detected in vicinity");
            break;
        case 'fluctuation':
            let system = random(['engines', 'shields', 'sensors', 'weapons']);
            CTRL.systemStatus[system] = random() < 0.7 ? "FLUCTUATING" : "DEGRADED";
            terminal.addMessage(`SYSTEM: Power fluctuation detected in ${system.toUpperCase()} subsystem`);
            setTimeout(() => {
                CTRL.systemStatus[system] = system === 'weapons' ? "STANDBY" : "NOMINAL";
            }, random(8000, 20000));
            break;
        case 'alert':
            if (CTRL.alertLevel < 2 && random() < 0.4) {
                CTRL.alertLevel++;
                terminal.addMessage(`ALERT: Alert level elevated to ${CTRL.alertLevel === 1 ? 'YELLOW' : 'RED'}`);
                setTimeout(() => {
                    CTRL.alertLevel = max(0, CTRL.alertLevel - 1);
                    terminal.addMessage(`ALERT: Alert level reduced to ${CTRL.alertLevel === 1 ? 'YELLOW' : 'NORMAL'}`);
                }, random(15000, 30000));
            }
            break;
    }
}

function draw() {
    t += 1 / 60;

    // Update parallax based on mouse position
    parallaxOffset.x = lerp(parallaxOffset.x, (mouseX - width / 2) * 0.015, 0.05);
    parallaxOffset.y = lerp(parallaxOffset.y, (mouseY - height / 2) * 0.015, 0.05);

    drawBackdrop();
    starfield.update(); starfield.draw();

    // Calculate alert pulse for visual effects
    let alertPulse = CTRL.alertLevel > 0 ? (sin(frameCount * (0.1 + CTRL.alertLevel * 0.05)) + 1) * 0.5 : 0;

    // Layout regions
    let pad = max(12, min(width, height) * 0.01);
    let topH = max(60, height * 0.11);
    let bottomH = max(100, height * 0.22);
    let leftW = width * 0.38;

    push(); // Start parallax effect
    translate(parallaxOffset.x, parallaxOffset.y);

    // PANEL GLASS with alert state
    let alertColor = THEME.alert[CTRL.alertLevel];
    let alertIntensity = CTRL.alertLevel > 0 ? 0.2 + alertPulse * 0.3 : 0;

    panelGlass(0, 0, width, topH, 14, THEME.panel, 0.07, alertColor, alertIntensity);
    panelGlass(0, topH, leftW, height - topH - bottomH, 14, THEME.panel, 0.07, alertColor, alertIntensity);
    panelGlass(leftW, topH, width - leftW, height - topH - bottomH, 14, THEME.panel, 0.07, alertColor, alertIntensity);
    panelGlass(0, height - bottomH, width, bottomH, 14, THEME.panel, 0.07, alertColor, alertIntensity);

    // Header
    drawHeader(0, 0, width, topH);

    // Left column — RADAR
    push();
    translate(0, topH);
    radar.update();
    radar.draw(0, 0, leftW, height - topH - bottomH);
    pop();

    // Right columns — Quantum Core + Data Grid overlay + Hologram
    push();
    translate(leftW, topH);
    let rightW = width - leftW;
    let rightH = height - topH - bottomH;

    // Split the right panel into two sections
    let coreW = rightW * 0.62;
    let holoW = rightW - coreW;

    core.update();
    core.draw(0, 0, coreW, rightH);

    // overlay grid with additive blending
    push();
    blendMode(ADD);
    grid.update();
    grid.draw(0, 0, coreW, rightH);
    pop();

    // Hologram display
    holo3d.update();
    holo3d.draw(coreW, 0, holoW, rightH);

    pop();

    // Bottom — Spectrum + Glyphs + Toggles + Terminal
    drawBottom(0, height - bottomH, width, bottomH);

    // Energy Pings
    for (let i = pings.length - 1; i >= 0; i--) {
        let p = pings[i];
        if (p.age > p.life) { pings.splice(i, 1); continue; }
        p.age += deltaTime / 1000;
        p.draw();
    }

    pop(); // End parallax effect

    // HUD Overlays (not affected by parallax)
    if (CTRL.shields) drawShieldVignette(CTRL.alertLevel > 0 ? alertColor : THEME.neonCyan);
    drawScanlines();

    // Terminal overlay (if active)
    if (terminalMode) {
        terminal.draw();
    } else {
        drawCursor();
    }

    // Alert flash
    if (CTRL.alertLevel > 0 && frameCount % 120 < 15) {
        push();
        noStroke();
        fill(hue(alertColor), saturation(alertColor), brightness(alertColor),
            map(alertPulse, 0, 1, 5, CTRL.alertLevel * 15));
        rect(0, 0, width, height);
        pop();
    }

    hoverInfo = ''; // reset hover hint text
}

/* ---------- BACKDROP ---------- */

function drawBackdrop() {
    // radial gradient cosmic background
    noStroke();
    let cx = width * 0.5, cy = height * 0.5;
    let r = dist(0, 0, width, height);
    for (let i = 0; i < 30; i++) {
        let k = i / 29;
        let c = lerpColor(THEME.bg1, THEME.bg0, k);
        fill(hue(c), saturation(c), brightness(c), 100 - k * 100);
        ellipse(cx, cy, r * (1.1 - k * 0.8));
    }

    // Add nebula/dust cloud effect
    if (!CTRL.stealth) {
        push();
        blendMode(SCREEN);
        noStroke();
        for (let i = 0; i < 5; i++) {
            let x = width * noise(i * 0.3, t * 0.01);
            let y = height * noise(i * 0.3 + 100, t * 0.01);
            let size = (width + height) * 0.3 * noise(i * 0.3 + 200, t * 0.01);
            let hueVal = map(noise(i * 0.3 + 300, t * 0.01), 0, 1, 180, 320);

            fill(hueVal, 70, 60, 8);
            ellipse(x, y, size, size);
        }
        pop();
    }
}

/* ---------- HEADER ---------- */

function drawHeader(x, y, w, h) {
    push();
    translate(x, y);

    // Alert color based on status
    let frameColor = CTRL.alertLevel > 0 ? THEME.alert[CTRL.alertLevel] : THEME.neonCyan;
    neonFrame(8, 8, w - 16, h - 16, 14, frameColor, CTRL.alertLevel > 0 ? 0.6 + sin(frameCount * 0.2) * 0.3 : 0.5);

    let name = "S.S. PARALLAX // BRIDGE CONTROL MK-XI";
    let id = "REG-" + nf(seed % 999999, 6) + " • CORE v" + floor(100 + (seed % 50)) + "." + floor(random(10, 99));

    // Current stardate
    let stardate = "STARDATE " + nf(floor((Date.now() / 86400000 + 2440587.5) * 10) / 10, 6, 1);

    fill(0, 0, CTRL.stealth ? 60 : 100, 100);
    textSize(min(22, h * 0.33));
    textAlign(LEFT, CENTER);
    text(name, 24, h * 0.45);

    fill(200, 10, CTRL.stealth ? 60 : 75, 100);
    textSize(min(14, h * 0.22));
    text(id, 24, h * 0.78);

    textAlign(RIGHT, CENTER);
    text(stardate, w - 24, h * 0.78);

    // Ship integrity indicator
    let integrityW = 120;
    let integrityH = 12;
    let integrityX = w - integrityW - 24;
    let integrityY = h * 0.42;

    fill(200, 10, 40, 50);
    rect(integrityX, integrityY, integrityW, integrityH, 6);

    let integrityColor = CTRL.shipIntegrity > 0.7 ? THEME.neonLime :
        CTRL.shipIntegrity > 0.3 ? THEME.neonAmber : THEME.neonRed;
    fill(integrityColor);
    rect(integrityX + 2, integrityY + 2, (integrityW - 4) * CTRL.shipIntegrity, integrityH - 4, 4);

    fill(0, 0, 100, 80);
    textSize(10);
    textAlign(CENTER, CENTER);
    text("HULL INTEGRITY", integrityX + integrityW / 2, integrityY - 8);

    // Right side status chips
    let chips = [
        ["WARP", CTRL.warp],
        ["SHIELDS", CTRL.shields],
        ["AUTONAV", CTRL.autonav],
        ["STEALTH", CTRL.stealth],
    ];
    let chipW = 100, chipH = 28, gap = 12;
    let ox = w - (chipW + gap) * chips.length - 24;
    for (let i = 0; i < chips.length; i++) {
        let c = chips[i];
        let col = c[1] ? THEME.neonLime : THEME.neonRed;
        statusChip(ox + i * (chipW + gap), h * 0.32, chipW, chipH, c[0], c[1], col);
    }

    // Alert indicator
    if (CTRL.alertLevel > 0) {
        let alertText = CTRL.alertLevel === 1 ? "YELLOW ALERT" : "RED ALERT";
        let alertCol = THEME.alert[CTRL.alertLevel];
        let alertPulse = (sin(frameCount * 0.2) + 1) * 0.5;

        fill(alertCol);
        textSize(14);
        textAlign(LEFT, CENTER);
        text(alertText, 240, h * 0.45);

        // Pulsing dot
        fill(alertCol);
        ellipse(220, h * 0.45, 10 + alertPulse * 5);
    }

    // Anomaly indicator
    if (CTRL.anomalyDetected) {
        let anomalyPulse = (sin(frameCount * 0.15) + 1) * 0.5;
        fill(THEME.neonMagenta);
        textSize(14);
        textAlign(LEFT, CENTER);
        text("QUANTUM ANOMALY", 400, h * 0.45);

        // Pulsing indicator
        fill(THEME.neonMagenta);
        ellipse(380, h * 0.45, 10 + anomalyPulse * 5);
    }

    pop();
}

function statusChip(x, y, w, h, label, on, col) {
    push();
    neonFrame(x, y, w, h, 8, col, on ? 0.7 : 0.25);
    fill(on ? col : color(200, 10, 70, 50));
    noStroke();
    rect(x + 2, y + h - 4, map(CTRL.throttle, 0, 1, 0, w - 4), 2, 1);
    fill(on ? 0 : 0, 0, on ? 100 : 70);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(label, x + w / 2, y + h / 2);
    pop();
}

/* ---------- RADAR ---------- */

class Radar {
    constructor() {
        this.targets = [];
        for (let i = 0; i < 24; i++) {
            this.targets.push(this.randomTarget());
        }
        this.angle = 0;
        this.pulse = 0;
        this.selected = 0;
        this.scanHistory = [];
        this.scanHistoryMax = 120;
    }
    randomTarget() {
        return {
            a: random(TAU),
            r: random(0.12, 0.92),
            strength: random(0.5, 1),
            type: random(['ship', 'asteroid', 'debris', 'station']),
            velocity: random(0.2, 0.8) * (random() < 0.5 ? 1 : -1),
            id: floor(random(100, 999))
        };
    }
    update() {
        let speed = CTRL.warp ? 2.4 : 0.8;
        this.angle = (this.angle + 0.01 * speed) % TAU;
        this.pulse += 0.02;

        // Record scan history for trails
        if (frameCount % 3 === 0) {
            let scanPoint = {
                angle: this.angle,
                time: frameCount
            };
            this.scanHistory.push(scanPoint);
            if (this.scanHistory.length > this.scanHistoryMax) {
                this.scanHistory.shift();
            }
        }

        // drift targets slightly
        for (let t of this.targets) {
            t.a += noise(t.id, frameCount * 0.001) * 0.002 - 0.001 + t.velocity * 0.0005;
            t.r += noise(t.id + 99, frameCount * 0.0013) * 0.001 - 0.0005;
            t.r = constrain(t.r, 0.08, 1.0);
        }

        // Add new targets occasionally
        if (random() < 0.001 && this.targets.length < 30) {
            this.targets.push(this.randomTarget());
            if (!CTRL.stealth && random() < 0.5) {
                terminal.addMessage(`RADAR: New contact detected: ${this.targets[this.targets.length - 1].type.toUpperCase()}-${this.targets[this.targets.length - 1].id}`);
            }
        }

        // Remove targets occasionally
        if (random() < 0.0005 && this.targets.length > 16) {
            this.targets.splice(floor(random(this.targets.length)), 1);
        }
    }
    draw(x, y, w, h) {
        push();
        translate(x, y);
        let cx = w / 2, cy = h / 2;
        let R = min(w, h) * 0.42;

        // Frame color based on alert status
        let frameColor = CTRL.alertLevel > 0 ? THEME.alert[CTRL.alertLevel] : THEME.neonMagenta;
        neonFrame(14, 14, w - 28, h - 28, 14, frameColor, CTRL.stealth ? 0.15 : 0.45);

        push();
        translate(cx, cy);

        // grid rings
        stroke(THEME.grid); strokeWeight(1); noFill();
        for (let i = 1; i <= 4; i++) {
            let ringOpacity = CTRL.stealth ? 15 : 40 - (CTRL.alertLevel > 0 ? sin(frameCount * 0.1) * 10 : 0);
            stroke(THEME.grid[0], THEME.grid[1], THEME.grid[2], ringOpacity);
            ellipse(0, 0, R * (i / 4) * 2);
            // Add range markers
            if (i < 4) {
                let rangeText = nf(i * 25, 3);
                fill(THEME.grid);
                textSize(9);
                textAlign(LEFT, CENTER);
                text(rangeText, R * (i / 4) + 4, 0);
            }
        }

        // angle markers (cardinal directions)
        for (let a = 0; a < TAU; a += TAU / 8) {
            let x1 = cos(a) * R * 0.9;
            let y1 = sin(a) * R * 0.9;
            let x2 = cos(a) * R * 1.0;
            let y2 = sin(a) * R * 1.0;
            stroke(THEME.grid);
            line(x1, y1, x2, y2);

            // Cardinal labels
            let cardinals = ["FWD", "SP", "AFT", "PS"];
            if (a % (TAU / 4) === 0) {
                let idx = (a / (TAU / 4)) % 4;
                fill(THEME.grid);
                textSize(10);
                textAlign(CENTER, CENTER);
                text(cardinals[idx], cos(a) * R * 1.08, sin(a) * R * 1.08);
            }
        }

        // crosshair
        line(-R, 0, R, 0); line(0, -R, 0, R);

        // Scan history for trail effect
        push();
        blendMode(ADD);
        for (let i = 0; i < this.scanHistory.length; i++) {
            let scan = this.scanHistory[i];
            let age = frameCount - scan.time;
            let alpha = map(age, 0, this.scanHistoryMax, 30, 0);

            if (alpha <= 0) continue;

            let a0 = scan.angle;
            noStroke();
            fill(182, 85, 95, CTRL.stealth ? alpha / 3 : alpha);
            arc(0, 0, R * 2, R * 2, a0, a0 + 0.35);
        }
        pop();

        // scanning wedge (current)
        let a0 = this.angle;
        noStroke();
        fill(182, 85, 95, CTRL.stealth ? 20 : 30);
        arc(0, 0, R * 2, R * 2, a0, a0 + 0.35);

        // Active scan ping
        if (millis() - lastPing < 800) {
            let pingAge = (millis() - lastPing) / 800;
            let pingRadius = R * pingAge;
            noFill();
            stroke(THEME.neonCyan);
            strokeWeight(2 - pingAge * 1.8);
            ellipse(0, 0, pingRadius * 2);
        }

        // targets
        for (let i = 0; i < this.targets.length; i++) {
            let t = this.targets[i];
            let r = R * t.r;
            let x = cos(t.a) * r;
            let y = sin(t.a) * r;

            let d = angularDiff(this.angle + 0.175, t.a);
            let seen = abs(d) < 0.22 || (millis() - lastPing < 800 && dist(0, 0, x, y) < map(millis() - lastPing, 0, 800, 0, R));
            let alpha = seen ? map(abs(d), 0, 0.22, 100, 20) : 20;

            // Target trail
            if (seen && !CTRL.stealth) {
                push();
                blendMode(ADD);
                stroke(90, 80, 100, 30);
                strokeWeight(1);
                let tailLen = 0.08 + t.velocity * 0.05;
                let tx = cos(t.a - tailLen) * r * 0.95;
                let ty = sin(t.a - tailLen) * r * 0.95;
                line(x, y, tx, ty);
                pop();
            }

            // Target icon based on type
            let s = map(t.strength, 0, 1, 3, 6);
            push();
            let targetColor = t.type === 'ship' ? THEME.neonLime :
                t.type === 'station' ? THEME.neonBlue :
                    t.type === 'asteroid' ? THEME.neonAmber :
                        THEME.neonMagenta;

            fill(hue(targetColor), saturation(targetColor), brightness(targetColor), alpha);
            noStroke();

            if (t.type === 'ship') {
                // Ship icon (triangle)
                beginShape();
                let shipSize = s * 1.2;
                let shipAngle = atan2(t.velocity, 0.1);
                vertex(x + cos(shipAngle) * shipSize, y + sin(shipAngle) * shipSize);
                vertex(x + cos(shipAngle + 2.5) * shipSize, y + sin(shipAngle + 2.5) * shipSize);
                vertex(x + cos(shipAngle - 2.5) * shipSize, y + sin(shipAngle - 2.5) * shipSize);
                endShape(CLOSE);
            } else if (t.type === 'station') {
                // Station icon (square)
                rectMode(CENTER);
                rect(x, y, s * 1.8, s * 1.8);
            } else if (t.type === 'asteroid') {
                // Asteroid icon (circle)
                ellipse(x, y, s * 2);
            } else {
                // Debris icon (diamond)
                push();
                translate(x, y);
                rotate(frameCount * 0.01);
                beginShape();
                vertex(0, -s);
                vertex(s, 0);
                vertex(0, s);
                vertex(-s, 0);
                endShape(CLOSE);
                pop();
            }

            // Highlight ring if seen
            if (seen) {
                noFill();
                stroke(targetColor);
                strokeWeight(1);
                ellipse(x, y, s * 4 + 6);
            }
            pop();

            if (CTRL.autonav && i === this.selected) {
                // route line to selected target
                push();
                blendMode(ADD);
                stroke(THEME.neonLime); strokeWeight(2);
                line(0, 0, x, y);
                noStroke();
                fill(THEME.neonLime);
                ellipse(x, y, 8, 8);

                // Distance marker
                let dist = t.r * 100;
                fill(THEME.neonLime);
                textSize(10);
                textAlign(CENTER, CENTER);
                text(floor(dist) + " KM", x, y + 14);
                pop();
            }

            // label if very seen
            if (seen && !CTRL.stealth) {
                fill(200, 10, 90);
                textSize(12);
                textAlign(LEFT, BOTTOM);
                text(`${t.type.toUpperCase()}-${t.id}`, x + 6, y - 4);
            }
        }

        pop();

        // annotations
        fill(0, 0, 90); textSize(12);
        textAlign(LEFT, TOP);
        text("RADAR // sector sweep", 24, 24);

        textAlign(RIGHT, TOP);
        fill(200, 10, 70);
        text("PING: " + (millis() - lastPing < 800 ? "ACTIVE" : "READY"), w - 24, 24);
        if (CTRL.autonav) {
            fill(THEME.neonLime);
            let targetObj = this.targets[this.selected];
            text(`NAV-> ${targetObj.type.toUpperCase()}-${targetObj.id}`, w - 24, 44);

            // Add intercept time
            let dist = targetObj.r * 100; // scaled distance in km
            let speed = CTRL.warp ? 80 : 20 * CTRL.throttle;
            let intercept = dist / speed;
            text(`ETA: ${intercept.toFixed(1)} MIN`, w - 24, 64);
        }

        // Sensor status
        fill(CTRL.systemStatus.sensors === "NOMINAL" ? THEME.neonCyan :
            CTRL.systemStatus.sensors === "DEGRADED" ? THEME.neonAmber : THEME.neonRed);
        textAlign(LEFT, BOTTOM);
        text("SENSOR STATUS: " + CTRL.systemStatus.sensors, 24, h - 24);

        // Contacts count
        text(`CONTACTS: ${this.targets.length}`, 24, h - 44);

        pop();
    }
}

function angularDiff(a, b) {
    let d = (a - b + PI) % (TAU) - PI;
    return d < -PI ? d + TAU : d;
}

/* ---------- QUANTUM CORE ---------- */

class QuantumCore {
    constructor() {
        this.theta = 0;
        this.dragging = false;
        this.energy = 0.5;
        this.resonance = 0;
        this.flowPoints = [];
        this.lastSpike = 0;

        // Create energy flow points
        for (let i = 0; i < 8; i++) {
            this.flowPoints.push({
                angle: i * PI / 4,
                intensity: random(0.3, 1),
                frequency: random(0.5, 2)
            });
        }
    }
    update() {
        this.theta += 0.01 + CTRL.throttle * 0.04 + (CTRL.warp ? 0.02 : 0);

        // Energy level follows throttle with some lag
        this.energy = lerp(this.energy, 0.2 + CTRL.throttle * 0.8, 0.01);

        // Resonance spikes occasionally
        if (millis() - this.lastSpike > 5000 && random() < 0.002) {
            this.resonance = 1;
            this.lastSpike = millis();

            // Visual effect
            pings.push(new Ping(width / 2, height / 2, CTRL.warp ? THEME.neonLime : THEME.neonCyan));

            // Cause system fluctuations
            if (random() < 0.3) {
                let system = random(['engines', 'shields', 'sensors', 'weapons']);
                CTRL.systemStatus[system] = "FLUCTUATING";
                setTimeout(() => { CTRL.systemStatus[system] = system === 'weapons' ? "STANDBY" : "NOMINAL"; }, 4000);
            }

            // Add message to terminal
            terminal.addMessage("CORE: Quantum resonance cascade detected");
        }

        // Decay resonance spike
        this.resonance *= 0.95;
    }
    draw(x, y, w, h) {
        push();
        translate(x, y);

        // Frame color changes based on core status
        let frameColor = CTRL.alertLevel > 0 ? THEME.alert[CTRL.alertLevel] : THEME.neonCyan;
        if (this.resonance > 0.4) {
            frameColor = lerpColor(frameColor, THEME.neonLime, this.resonance);
        }

        neonFrame(14, 14, w - 28, h - 28, 14, frameColor, CTRL.stealth ? 0.2 : 0.5);

        let cx = w / 2, cy = h / 2;
        let R = min(w, h) * 0.33;
        push();
        translate(cx, cy);

        // Background radiation field
        push();
        blendMode(ADD);
        noStroke();
        for (let i = 0; i < 30; i++) {
            let angle = i * TAU / 30 + this.theta;
            let x0 = cos(angle) * R * 0.8;
            let y0 = sin(angle) * R * 0.8;
            let size = 5 + sin(angle * 3 + this.theta * 2) * 4;
            let intensity = (0.2 + 0.8 * this.energy) * (0.5 + 0.5 * sin(angle * 2 + this.theta * 3));

            let col = lerpColor(
                CTRL.warp ? THEME.neonLime : THEME.neonCyan,
                THEME.neonMagenta,
                noise(angle, this.theta * 0.5)
            );

            fill(hue(col), saturation(col), brightness(col), 30 * intensity);
            ellipse(x0, y0, size * (1 + this.resonance), size * (1 + this.resonance));
        }
        pop();

        // energy halo
        noFill(); strokeWeight(2);
        let haloCol = lerpColor(THEME.neonMagenta, THEME.neonCyan, (sin(this.theta * 0.7) + 1) / 2);
        // Blend with resonance color
        if (this.resonance > 0.2) {
            haloCol = lerpColor(haloCol, THEME.neonLime, this.resonance);
        }
        glowCircle(0, 0, R * 1.28, haloCol, 0.25 + this.resonance * 0.5);

        // Energy flow lines
        push();
        blendMode(ADD);
        for (let point of this.flowPoints) {
            let angle = point.angle + this.theta * point.frequency * 0.1;
            let x1 = cos(angle) * R * 0.3;
            let y1 = sin(angle) * R * 0.3;
            let x2 = cos(angle) * R * (0.8 + this.energy * 0.3 + sin(this.theta * 2 + angle) * 0.1);
            let y2 = sin(angle) * R * (0.8 + this.energy * 0.3 + sin(this.theta * 2 + angle) * 0.1);

            let energyColor = CTRL.warp ? THEME.neonLime : THEME.neonAmber;
            if (this.resonance > 0.3) {
                energyColor = lerpColor(energyColor, THEME.neonLime, this.resonance);
            }

            stroke(hue(energyColor), saturation(energyColor), brightness(energyColor),
                70 * point.intensity * (0.7 + 0.3 * sin(this.theta * 3 + angle * 2)));
            strokeWeight(1 + this.energy * 2 * point.intensity);
            line(x1, y1, x2, y2);

            // Energy node
            noStroke();
            fill(energyColor);
            let nodeSize = 3 + this.energy * 3 * point.intensity + (this.resonance * 5 * point.intensity);
            ellipse(x2, y2, nodeSize, nodeSize);
        }
        pop();

        // superformula-like core
        let m = floor(4 + CTRL.throttle * 10);
        let n1 = 0.3 + CTRL.throttle * 1.1;
        let n2 = 1.7 + 0.3 * sin(this.theta * 1.3);
        let n3 = 1.7 + 0.3 * cos(this.theta * 1.1);
        let a = 1, b = 1;

        push();
        rotate(this.theta * 0.7);
        let col = CTRL.warp ? THEME.neonLime : THEME.neonAmber;
        // Blend with resonance
        if (this.resonance > 0.3) {
            col = lerpColor(col, THEME.neonLime, this.resonance);
        }

        // Core outline
        stroke(col);
        strokeWeight(1.5 + this.resonance * 2);
        noFill();
        beginShape();
        for (let a0 = 0; a0 < TAU; a0 += 0.05) {
            let r = superShape(a0, m, n1, n2, n3, a, b);
            let rr = R * 0.55 * (0.85 + 0.15 * sin(this.theta * 2 + a0 * 3));
            // Add resonance distortion
            if (this.resonance > 0.2) {
                rr *= 1 + sin(a0 * 8 + this.theta * 10) * this.resonance * 0.15;
            }
            let x0 = rr * r * cos(a0);
            let y0 = rr * r * sin(a0);
            vertex(x0, y0);
        }
        endShape(CLOSE);

        // Core fill
        if (this.energy > 0.3 || this.resonance > 0.4) {
            beginShape();
            fill(hue(col), saturation(col), brightness(col),
                map(this.energy, 0.3, 1, 0, 30) + this.resonance * 40);
            for (let a0 = 0; a0 < TAU; a0 += 0.05) {
                let r = superShape(a0, m, n1, n2, n3, a, b);
                let rr = R * 0.50 * (0.85 + 0.15 * sin(this.theta * 2 + a0 * 3));
                // Add resonance distortion
                if (this.resonance > 0.2) {
                    rr *= 1 + sin(a0 * 8 + this.theta * 10) * this.resonance * 0.15;
                }
                let x0 = rr * r * cos(a0);
                let y0 = rr * r * sin(a0);
                vertex(x0, y0);
            }
            endShape(CLOSE);
        }
        pop();

        // rotating rings
        for (let i = 0; i < 3; i++) {
            let ang = this.theta * (0.6 + i * 0.2);
            push();
            rotate(ang + i * 0.5);
            stroke(182, 85, 95, 70 - i * 20);
            noFill();
            ellipse(0, 0, R * 1.1 - i * 20, R * 0.6 - i * 10);
            pop();
        }

        // Add resonance waves when active
        if (this.resonance > 0.1) {
            push();
            blendMode(ADD);
            noFill();
            for (let i = 0; i < 3; i++) {
                let waveRadius = R * (0.9 + i * 0.3) * this.resonance;
                stroke(THEME.neonLime);
                strokeWeight(1 + this.resonance);
                ellipse(0, 0, waveRadius * 2, waveRadius * 2);
            }
            pop();
        }

        // throttle ring (interactive)
        let ringR = R * 0.95;
        stroke(THEME.white); noFill(); strokeWeight(1);
        ellipse(0, 0, ringR * 2, ringR * 2);
        let a0 = -HALF_PI + CTRL.throttle * TAU;
        let vtx = cos(a0) * ringR, vty = sin(a0) * ringR;
        push();
        // Throttle handle changes color with power level
        let throttleColor = lerpColor(
            THEME.neonRed,
            THEME.neonLime,
            CTRL.throttle
        );
        glowCircle(vtx, vty, 16, throttleColor, 0.5 + CTRL.throttle * 0.5);
        pop();

        // Labels for core status
        fill(200, 10, 85); noStroke();
        textAlign(CENTER, CENTER);
        textSize(14);
        text("QUANTUM CORE", 0, -R * 1.2);

        textSize(12);
        text("THROTTLE " + nf(CTRL.throttle * 100, 2, 0) + "%", 0, R * 1.2);

        // Core temperature
        let tempValue = 78 + CTRL.throttle * 40 + (CTRL.warp ? 30 : 0) + this.resonance * 40;
        let tempColor = tempValue > 150 ? THEME.neonRed :
            tempValue > 120 ? THEME.neonAmber : THEME.neonCyan;
        fill(tempColor);
        text(`CORE TEMP: ${floor(tempValue)}°C`, 0, R * 1.2 + 20);

        // Engine status
        fill(CTRL.systemStatus.engines === "NOMINAL" ? THEME.neonCyan :
            CTRL.systemStatus.engines === "FLUCTUATING" ? THEME.neonAmber : THEME.neonRed);
        text("ENGINE STATUS: " + CTRL.systemStatus.engines, 0, R * 1.2 + 40);

        // drag interaction hint
        let mpos = createVector(mouseX - (x + cx), mouseY - (y + cy));
        if (mpos.mag() < ringR + 18 && mpos.mag() > ringR - 18) {
            hoverInfo = "Drag the core ring to set throttle";
            if (mouseIsPressed) {
                let ang = atan2(mpos.y, mpos.x);
                CTRL.throttle = (ang + HALF_PI + TAU) % TAU / TAU;
                CTRL.throttle = constrain(CTRL.throttle, 0, 1);
                // Play sound on significant throttle changes
                if (frameCount % 10 === 0) {
                    sounds.beep.play();
                }
            }
        }

        pop();
        pop();
    }
}

function superShape(theta, m, n1, n2, n3, a, b) {
    // Johan Gielis superformula
    let t1 = pow(abs((1 / a) * cos(m * theta / 4)), n2);
    let t2 = pow(abs((1 / b) * sin(m * theta / 4)), n3);
    let r = pow(t1 + t2, -1 / n1);
    return r;
}

/* ---------- STARFIELD ---------- */

class Starfield {
    constructor(n) {
        this.stars = [];
        for (let i = 0; i < n; i++) this.stars.push(this.newStar());
    }
    newStar() {
        return {
            x: random(-width, width),
            y: random(-height, height),
            z: random(width),
            pz: 0,
            size: random(0.5, 1.2),
            hue: random([182, 315, 34, 210]),
        };
    }
    update() {
        let base = 6;
        let spd = base + CTRL.throttle * 18 + (CTRL.warp ? 28 : 0);
        for (let s of this.stars) {
            s.pz = s.z;
            s.z -= spd;
            if (s.z < 1) {
                s.x = random(-width, width);
                s.y = random(-height, height);
                s.z = width;
                s.pz = s.z;
                s.hue = random([182, 315, 34, 210]);
                s.size = random(0.5, 1.2) + (CTRL.warp ? random(0.5) : 0);
            }
        }
    }
    draw() {
        push();
        translate(width / 2, height / 2);
        blendMode(ADD);
        strokeWeight(1.2);
        for (let s of this.stars) {
            let sx = map(s.x / s.z, -1, 1, -width / 2, width / 2);
            let sy = map(s.y / s.z, -1, 1, -height / 2, height / 2);

            let px = map(s.x / s.pz, -1, 1, -width / 2, width / 2);
            let py = map(s.y / s.pz, -1, 1, -height / 2, height / 2);

            let intensity = map(s.z, 0, width, 100, 20);
            let col = color(s.hue, 85, 95, CTRL.stealth ? intensity * 0.5 : intensity);

            // Star size varies with distance
            let starSize = s.size * map(s.z, 0, width, 1.5, 0.5);

            // In warp mode, add more streaking effects
            if (CTRL.warp) {
                // Main streak
                stroke(col);
                strokeWeight(starSize);
                line(px, py, sx, sy);

                // Additional blue-shifted streak
                let warpCol = color(210, 85, 95, intensity * 0.4);
                stroke(warpCol);
                strokeWeight(starSize * 0.7);
                let wx = px - (sx - px) * 0.3;
                let wy = py - (sy - py) * 0.3;
                line(px, py, wx, wy);
            } else {
                // Normal mode - just draw lines
                stroke(col);
                strokeWeight(starSize);
                line(px, py, sx, sy);
            }

            // Add star points at the end for brighter stars
            if (s.size > 1 && !CTRL.stealth) {
                noStroke();
                fill(s.hue, 40, 100, intensity);
                ellipse(sx, sy, starSize * 2);
            }
        }
        pop();
    }
}

/* ---------- SIGNAL GRID ---------- */

class SignalGrid {
    constructor(cols, rows) {
        this.cols = cols; this.rows = rows;
        this.nodes = [];
        this.edges = [];
        this.packets = [];
        this.rebuild();
    }
    rebuild() {
        this.nodes.length = 0;
        this.edges.length = 0;
        this.packets.length = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.nodes.push({
                    x, y, id: y * this.cols + x,
                    activity: random(0.3, 1)
                });
            }
        }
        let idx = (x, y) => y * this.cols + x;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (x < this.cols - 1) this.edges.push([idx(x, y), idx(x + 1, y)]);
                if (y < this.rows - 1) this.edges.push([idx(x, y), idx(x, y + 1)]);

                // Add some diagonal edges for more interesting grid
                if (x < this.cols - 1 && y < this.rows - 1 && random() < 0.2) {
                    this.edges.push([idx(x, y), idx(x + 1, y + 1)]);
                }
                if (x > 0 && y < this.rows - 1 && random() < 0.2) {
                    this.edges.push([idx(x, y), idx(x - 1, y + 1)]);
                }
            }
        }
        for (let i = 0; i < 36; i++) {
            let e = random(this.edges);
            this.packets.push({
                e, t: random(1), dir: random([1, -1]),
                hue: random([182, 315, 34, 90]),
                speed: random(0.003, 0.01),
                size: random(1, 3),
                priority: random() < 0.2 // some packets are high priority
            });
        }
    }
    update() {
        // Activity pulses through the grid
        for (let node of this.nodes) {
            node.activity = 0.3 + 0.7 * noise(node.x * 0.2, node.y * 0.2, t * 0.3);
        }

        for (let p of this.packets) {
            let speedMult = 1 + CTRL.throttle * 2 + (CTRL.warp ? 2 : 0);
            if (p.priority) speedMult *= 1.5; // High priority packets move faster

            p.t += p.speed * p.dir * speedMult;

            if (p.t < 0 || p.t > 1) {
                // hop to a connected edge at the end
                p.dir *= -1;
                p.t = constrain(p.t, 0, 1);
                if (random() < 0.6) {
                    // change edge
                    let nodeIdx = p.dir > 0 ? p.e[0] : p.e[1];
                    let cand = this.edges.filter(e => e[0] === nodeIdx || e[1] === nodeIdx);
                    if (cand.length) p.e = random(cand);
                }
            }
        }

        // Add new packets occasionally
        if (random() < 0.05 && this.packets.length < 50) {
            let e = random(this.edges);
            this.packets.push({
                e, t: 0, dir: 1,
                hue: random([182, 315, 34, 90]),
                speed: random(0.003, 0.01),
                size: random(1, 3),
                priority: random() < 0.2
            });
        }

        // Remove some packets occasionally
        if (random() < 0.02 && this.packets.length > 25) {
            this.packets.splice(floor(random(this.packets.length)), 1);
        }
    }
    draw(x, y, w, h) {
        push();
        translate(x, y);
        let pad = 24;
        let cw = w - pad * 2;
        let ch = h - pad * 2;

        // Draw nodes
        push();
        blendMode(ADD);
        for (let node of this.nodes) {
            let nx = map(node.x, 0, this.cols - 1, pad, w - pad);
            let ny = map(node.y, 0, this.rows - 1, pad, h - pad);

            let activity = node.activity * (CTRL.stealth ? 0.5 : 1);
            fill(182, 85, 95, 30 * activity);
            noStroke();
            ellipse(nx, ny, 4 * activity, 4 * activity);
        }
        pop();

        // grid lines
        stroke(200, 20, CTRL.stealth ? 25 : 45); strokeWeight(1);
        for (let e of this.edges) {
            let a = this.nodes[e[0]], b = this.nodes[e[1]];
            let ax = map(a.x, 0, this.cols - 1, pad, w - pad);
            let ay = map(a.y, 0, this.rows - 1, pad, h - pad);
            let bx = map(b.x, 0, this.cols - 1, pad, w - pad);
            let by = map(b.y, 0, this.rows - 1, pad, h - pad);

            // Edge activity is based on connected nodes
            let edgeActivity = (a.activity + b.activity) * 0.5;
            stroke(200, 20, map(edgeActivity, 0, 1, 15, 45));
            line(ax, ay, bx, by);
        }

        // packets
        blendMode(ADD);
        for (let p of this.packets) {
            let a = this.nodes[p.e[0]], b = this.nodes[p.e[1]];
            let ax = map(a.x, 0, this.cols - 1, pad, w - pad);
            let ay = map(a.y, 0, this.rows - 1, pad, h - pad);
            let bx = map(b.x, 0, this.cols - 1, pad, w - pad);
            let by = map(b.y, 0, this.rows - 1, pad, h - pad);
            let x0 = lerp(ax, bx, p.t);
            let y0 = lerp(ay, by, p.t);

            // Different visual treatment for priority packets
            if (p.priority) {
                // Draw packet with trail
                stroke(p.hue, 80, 100, CTRL.stealth ? 30 : 80);
                strokeWeight(p.size * 0.7);
                let trailLen = 0.1;
                let tx = lerp(ax, bx, p.t - trailLen * p.dir);
                let ty = lerp(ay, by, p.t - trailLen * p.dir);
                line(x0, y0, tx, ty);

                // Pulse around high priority packets
                noStroke();
                fill(p.hue, 80, 100, (15 + 10 * sin(frameCount * 0.2)) * (CTRL.stealth ? 0.5 : 1));
                ellipse(x0, y0, p.size * 4, p.size * 4);
            }

            // Actual packet
            noStroke();
            fill(p.hue, 80, 100, CTRL.stealth ? 30 : 80);
            ellipse(x0, y0, p.size * 2, p.size * 2);
        }

        pop();
    }
}

/* ---------- 3D HOLOGRAM ---------- */

class Hologram {
    constructor() {
        this.theta = 0;
        this.phi = PI / 6;
        this.model = this.createModel();
        this.targetObject = null;
        this.dragging = false;
        this.labelPoints = [];
    }

    createModel() {
        // Create a complex 3D model representing a spacecraft
        let model = {
            vertices: [],
            edges: [],
            surfaces: [],
            colors: []
        };

        // Ship hull shape
        let sections = 10;
        let pointsPerSection = 8;

        for (let s = 0; s < sections; s++) {
            let z = map(s, 0, sections - 1, -1, 1);
            // Ship profile - wider in middle, tapering at ends
            let radius = 0.4 * (1 - pow(abs(z) * 1.2, 2));

            // Add points around this slice
            for (let p = 0; p < pointsPerSection; p++) {
                let angle = p * TAU / pointsPerSection;
                // Make it more interesting with some deformation
                let r = radius * (1 + 0.1 * sin(angle * 2 + z * 3));
                let x = r * cos(angle);
                let y = r * sin(angle);
                model.vertices.push({ x, y, z });

                // Add hull color
                model.colors.push(s < 6 ? THEME.neonCyan : THEME.neonMagenta);

                // Connect to next point in same section
                if (p > 0) {
                    model.edges.push([
                        (s * pointsPerSection) + p,
                        (s * pointsPerSection) + p - 1
                    ]);
                }

                // Connect first and last point
                if (p === pointsPerSection - 1) {
                    model.edges.push([
                        (s * pointsPerSection) + p,
                        (s * pointsPerSection)
                    ]);
                }

                // Connect to corresponding point in next section
                if (s < sections - 1) {
                    model.edges.push([
                        (s * pointsPerSection) + p,
                        ((s + 1) * pointsPerSection) + p
                    ]);
                }
            }
        }

        // Add wings/fins
        let wingPoints = [
            { x: 0.1, y: 0, z: -0.2 }, // root front
            { x: 0.6, y: 0, z: 0.2 },  // tip front
            { x: 0.6, y: 0, z: 0.6 },  // tip back
            { x: 0.1, y: 0, z: 0.4 }   // root back
        ];

        // Add wings on both sides
        for (let side = -1; side <= 1; side += 2) {
            let startIdx = model.vertices.length;

            // Add wing points
            for (let p of wingPoints) {
                model.vertices.push({ x: p.x * side, y: p.y, z: p.z });
                model.colors.push(THEME.neonLime);
            }

            // Add wing edges
            for (let i = 0; i < wingPoints.length; i++) {
                model.edges.push([
                    startIdx + i,
                    startIdx + (i + 1) % wingPoints.length
                ]);
            }
        }

        // Add engine nozzles
        let nozzlePoints = 8;
        let nozzleRadius = 0.15;
        let nozzleZ = 1.1;

        // Add left engine
        let leftStartIdx = model.vertices.length;
        for (let i = 0; i < nozzlePoints; i++) {
            let angle = i * TAU / nozzlePoints;
            let x = -0.25 + nozzleRadius * cos(angle);
            let y = nozzleRadius * sin(angle);
            model.vertices.push({ x, y, z: nozzleZ });
            model.colors.push(THEME.neonAmber);
        }

        // Add right engine
        let rightStartIdx = model.vertices.length;
        for (let i = 0; i < nozzlePoints; i++) {
            let angle = i * TAU / nozzlePoints;
            let x = 0.25 + nozzleRadius * cos(angle);
            let y = nozzleRadius * sin(angle);
            model.vertices.push({ x, y, z: nozzleZ });
            model.colors.push(THEME.neonAmber);
        }

        // Connect engine points
        for (let engine = 0; engine < 2; engine++) {
            let startIdx = engine === 0 ? leftStartIdx : rightStartIdx;
            for (let i = 0; i < nozzlePoints; i++) {
                model.edges.push([
                    startIdx + i,
                    startIdx + (i + 1) % nozzlePoints
                ]);
            }
        }

        // Add labeled points for ship features
        this.labelPoints = [
            { x: 0, y: 0, z: -1, label: "FORWARD SENSOR" },
            { x: 0, y: 0.35, z: 0, label: "BRIDGE" },
            { x: 0, y: -0.35, z: 0.2, label: "CARGO" },
            { x: -0.25, y: 0, z: 1.1, label: "ENGINE L" },
            { x: 0.25, y: 0, z: 1.1, label: "ENGINE R" },
            { x: 0.5, y: 0, z: 0.3, label: "WING" }
        ];

        return model;
    }

    update() {
        this.theta += 0.005;

        // If we have a target object from radar, update model
        if (this.targetObject) {
            // TODO: Create a different model based on target type
        }
    }

    project(point, scale) {
        // 3D rotation and projection
        let ct = cos(this.theta);
        let st = sin(this.theta);
        let cp = cos(this.phi);
        let sp = sin(this.phi);

        // Rotate around Y axis
        let x1 = point.x * ct - point.z * st;
        let z1 = point.x * st + point.z * ct;

        // Rotate around X axis
        let y2 = point.y * cp - z1 * sp;
        let z2 = point.y * sp + z1 * cp;

        // Simple perspective projection
        let depth = 5;
        let projectionScale = depth / (depth + z2);

        return {
            x: x1 * projectionScale * scale,
            y: y2 * projectionScale * scale,
            z: z2
        };
    }

    draw(x, y, w, h) {
        push();
        translate(x, y);

        // Frame with subtle title
        neonFrame(14, 14, w - 28, h - 28, 14, THEME.neonBlue, CTRL.stealth ? 0.15 : 0.4);

        let cx = w / 2, cy = h / 2;
        let scale = min(w, h) * 0.35;

        push();
        translate(cx, cy);

        // Draw hologram base
        stroke(THEME.neonBlue);
        strokeWeight(1);
        noFill();
        ellipse(0, scale * 0.8, scale * 1.6, scale * 0.3);

        // Hologram light shaft
        push();
        blendMode(ADD);
        noStroke();
        let gradientHeight = scale * 1.6;
        for (let i = 0; i < gradientHeight; i += 4) {
            let alpha = map(i, 0, gradientHeight, 30, 5) * (CTRL.stealth ? 0.5 : 1);
            fill(THEME.neonBlue[0], THEME.neonBlue[1], THEME.neonBlue[2], alpha);
            let y0 = scale * 0.8 - i;
            ellipse(0, y0, scale * 1.6 * (1 - i / gradientHeight * 0.8), scale * 0.2);
        }
        pop();

        // Draw 3D model
        push();
        translate(0, 0);

        // Check for mouse interaction
        let mpos = createVector(mouseX - (x + cx), mouseY - (y + cy));
        if (mpos.mag() < scale && !terminalMode) {
            hoverInfo = "Drag to rotate hologram model";

            if (mouseIsPressed && !this.dragging) {
                this.dragging = true;
            }
        }

        if (this.dragging && mouseIsPressed) {
            // Update rotation based on mouse drag
            this.theta = map(mouseX, 0, width, -PI, PI);
            this.phi = constrain(map(mouseY, 0, height, -PI / 2, PI / 2), -PI / 2, PI / 2);
        } else {
            this.dragging = false;
        }

        // Draw connection lines
        stroke(THEME.neonBlue);
        strokeWeight(1);
        for (let edge of this.model.edges) {
            let v1 = this.project(this.model.vertices[edge[0]], scale);
            let v2 = this.project(this.model.vertices[edge[1]], scale);

            // Don't draw if behind the view
            if (v1.z < 0 && v2.z < 0) continue;

            // Depth-based brightness
            let depth = (v1.z + v2.z) * 0.5 + 1; // +1 to avoid negative values
            let brightness = map(depth, 0, 2, 20, 70) * (CTRL.stealth ? 0.5 : 1);

            // Get edge color from first vertex
            let edgeColor = this.model.colors[edge[0]];
            stroke(hue(edgeColor), saturation(edgeColor), brightness);

            line(v1.x, v1.y, v2.x, v2.y);
        }

        // Draw vertices
        noStroke();
        for (let i = 0; i < this.model.vertices.length; i++) {
            let v = this.project(this.model.vertices[i], scale);

            // Don't draw if behind the view
            if (v.z < 0) continue;

            // Depth-based brightness and size
            let depth = v.z + 1; // +1 to avoid negative values
            let brightness = map(depth, 0, 2, 30, 90) * (CTRL.stealth ? 0.5 : 1);
            let size = map(depth, 0, 2, 4, 2);

            // Use vertex color
            fill(hue(this.model.colors[i]), saturation(this.model.colors[i]), brightness);
            ellipse(v.x, v.y, size, size);
        }

        // Draw label points
        for (let point of this.labelPoints) {
            let v = this.project(point, scale);

            // Don't draw if behind the view
            if (v.z < 0) continue;

            // Depth-based brightness
            let depth = v.z + 1;
            let brightness = map(depth, 0, 2, 30, 90) * (CTRL.stealth ? 0.5 : 1);

            fill(THEME.neonBlue[0], THEME.neonBlue[1], brightness);
            ellipse(v.x, v.y, 5, 5);

            // Draw label only for points facing us
            if (v.z > 0) {
                // Draw connecting line
                stroke(THEME.neonBlue[0], THEME.neonBlue[1], brightness, 70);
                strokeWeight(1);
                let labelOffset = 30;
                let labelX = v.x + (v.x > 0 ? labelOffset : -labelOffset);
                line(v.x, v.y, labelX, v.y);

                // Draw label
                noStroke();
                fill(THEME.neonBlue[0], THEME.neonBlue[1], brightness);
                textSize(10);
                textAlign(v.x > 0 ? LEFT : RIGHT, CENTER);
                text(point.label, labelX, v.y);
            }
        }

        pop();

        // Hologram title and info
        fill(THEME.neonBlue);
        textSize(14);
        textAlign(CENTER, TOP);
        text("SHIP SCHEMATIC", 0, -scale * 0.8);

        // Display scan detail level
        textSize(11);
        fill(200, 10, 70);
        text(`SCAN DETAIL: ${CTRL.stealth ? "LOW" : "HIGH"}`, 0, scale * 0.9);

        if (CTRL.autonav) {
            fill(THEME.neonLime);
            text("NAVIGATION TARGET LOCKED", 0, scale * 1.0);
        }

        pop();
        pop();
    }
}

/* ---------- SPECTRUM ---------- */

class Spectrum {
    constructor() {
        this.bins = 64;
        this.phase = random(1000);
        this.markers = [];

        // Add some frequency markers
        for (let i = 0; i < 3; i++) {
            this.markers.push({
                position: random(0.1, 0.9),
                pulseRate: random(0.5, 2),
                type: random(['comm', 'sensor', 'anomaly'])
            });
        }
    }
    update() {
        this.phase += 0.008 + CTRL.throttle * 0.02 + (CTRL.warp ? 0.01 : 0);

        // Update markers
        if (random() < 0.01 && this.markers.length < 5) {
            this.markers.push({
                position: random(0.1, 0.9),
                pulseRate: random(0.5, 2),
                type: random(['comm', 'sensor', 'anomaly'])
            });
        }

        // Remove markers occasionally
        if (random() < 0.005 && this.markers.length > 2) {
            this.markers.splice(floor(random(this.markers.length)), 1);
        }
    }
    draw(x, y, w, h) {
        this.update();
        push();
        translate(x, y);
        let pad = 16;
        let cw = w - pad * 2;
        let ch = h - pad * 2;
        let bw = cw / this.bins;

        // frame
        let frameColor = CTRL.alertLevel > 0 ? THEME.alert[CTRL.alertLevel] : THEME.neonAmber;
        neonFrame(pad, pad, cw, ch, 8, frameColor, CTRL.stealth ? 0.15 : 0.4);

        // Background grid
        push();
        stroke(200, 20, 45, 20);
        strokeWeight(1);

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            let y0 = pad + ch * i / 4;
            line(pad, y0, pad + cw, y0);
        }

        // Vertical grid lines
        for (let i = 0; i <= 4; i++) {
            let x0 = pad + cw * i / 4;
            line(x0, pad, x0, pad + ch);
        }
        pop();

        // frequency markers
        push();
        for (let marker of this.markers) {
            let x0 = pad + cw * marker.position;
            let pulseHeight = ch * (0.5 + 0.4 * sin(this.phase * marker.pulseRate));

            let markerColor = marker.type === 'comm' ? THEME.neonCyan :
                marker.type === 'sensor' ? THEME.neonLime :
                    THEME.neonMagenta;

            // Marker line
            stroke(markerColor);
            strokeWeight(1);
            line(x0, pad, x0, pad + ch);

            // Marker label
            fill(markerColor);
            textSize(10);
            textAlign(CENTER, BOTTOM);
            text(marker.type.toUpperCase(), x0, pad);

            // Frequency value
            let freq = marker.position * 18 + 120;
            textAlign(CENTER, TOP);
            text(freq.toFixed(1) + " GHz", x0, pad + ch + 2);

            // Amplitude indicator
            noStroke();
            fill(hue(markerColor), saturation(markerColor), brightness(markerColor), 30);
            rect(x0 - 3, pad + ch - pulseHeight, 6, pulseHeight);
        }
        pop();

        // spectrum bars
        let baseHue = CTRL.warp ? 90 : 34;
        for (let i = 0; i < this.bins; i++) {
            // Generate a more complex spectrum based on noise and throttle
            let n = noise(i * 0.17, this.phase) *
                noise(i * 0.07, this.phase * 0.7) *
                (0.4 + 0.6 * noise(i * 0.03, this.phase * 0.3));

            // Add some harmonic overtones based on throttle
            if (CTRL.throttle > 0.5) {
                let harmonic = sin(i * 0.2 + this.phase) * CTRL.throttle * 0.4;
                n = min(1, n + harmonic);
            }

            // Add alert-state fluctuations
            if (CTRL.alertLevel > 0) {
                let alert = sin(i * 0.3 + this.phase * 1.5) * CTRL.alertLevel * 0.3;
                n = min(1, n + alert);
            }

            let hgt = pow(n, 1.2) * ch * 0.88;
            let x0 = pad + i * bw + 1;
            let y0 = pad + ch - hgt;
            noStroke();
            fill(baseHue, 85, 100, CTRL.stealth ? 30 : 75);
            rect(x0, y0, bw - 2, hgt, 2);
        }

        fill(200, 10, 85);
        textAlign(LEFT, TOP);
        textSize(12);
        text("HARMONIC SPECTRUM", pad + 8, pad + 6);

        // Add frequency range indicator
        fill(200, 10, 65);
        textSize(10);
        textAlign(RIGHT, TOP);
        text("120-300 GHz", pad + cw - 8, pad + 6);

        pop();
    }
}

/* ---------- GLYPH TAPE ---------- */

class GlyphTape {
    constructor(rows) {
        this.rows = rows;
        this.columns = 64;
        this.data = [];
        for (let r = 0; r < rows; r++) this.data.push(this.randomLine());
        this.offset = 0;
    }
    randomLine() {
        let glyphs = "⟡⊕⋄⌁⌂⚙◌◍◈◉◒◓◔◕◆◇◻◽▢▣▤▥▦▧▨▩░▒▓▮▯▰▱▵▴▿▾▹▸◁◀▷▶◢◣◤◥◦◯△▽☼☍☌☊☉☽☾✶✷✸✹✺✦✧✩✪✫✬✭";
        let s = '';
        for (let i = 0; i < this.columns; i++) {
            if (random() < 0.08) s += ' ';
            else s += glyphs.charAt(floor(random(glyphs.length)));
        }
        return s;
    }
    update() {
        this.offset += 0.5 + CTRL.throttle * 1.5 + (CTRL.warp ? 1 : 0) + (CTRL.anomalyDetected ? 2 : 0);
        if (this.offset > 16) {
            this.offset = 0;
            this.data.shift();
            this.data.push(this.randomLine());
        }
    }
    draw(x, y, w, h) {
        this.update();
        push();
        translate(x, y);
        let pad = 16;
        let cw = w - pad * 2;
        let ch = h - pad * 2;

        // Frame depends on anomaly detection
        let frameColor = CTRL.anomalyDetected ? THEME.neonMagenta : THEME.neonMagenta;
        neonFrame(pad, pad, cw, ch, 8, frameColor, CTRL.stealth ? 0.15 : 0.35);

        textAlign(LEFT, TOP);
        textSize(14);
        let lineH = 16;
        for (let r = 0; r < this.rows; r++) {
            let yy = pad + 8 + r * lineH - this.offset;

            // Base color depends on anomaly detection
            let baseColor = CTRL.anomalyDetected ?
                lerpColor(THEME.neonMagenta, THEME.white, 0.3 + 0.2 * sin(frameCount * 0.1)) :
                color(200, 10, 80);

            fill(baseColor);
            text(this.data[r], pad + 8, yy);

            // echo trail
            fill(200, 10, 60, 40);
            text(this.data[r], pad + 8, yy + 1);
        }

        fill(200, 10, 85);
        textSize(12);
        text("GLYPH STREAM", pad + 8, pad + ch - 20);

        // Add activity indicator
        let statusText = CTRL.anomalyDetected ? "ANOMALY DETECTED" : "NOMINAL";
        let statusColor = CTRL.anomalyDetected ? THEME.neonMagenta : THEME.neonCyan;

        fill(statusColor);
        textAlign(RIGHT, BOTTOM);
        text(statusText, pad + cw - 8, pad + ch - 20);

        pop();
    }
}

/* ---------- TERMINAL ---------- */

class Terminal {
    constructor() {
        this.messages = [];
        this.input = "";
        this.cursor = 0;
        this.cursorBlink = 0;
        this.maxMessages = 16;
        this.addMessage("SYSTEM: Terminal ready");
        this.addMessage("SYSTEM: Type 'help' for commands");
        this.commandHistory = [];
        this.historyIndex = -1;
    }

    addMessage(text) {
        let timestamp = nf(hour(), 2) + ":" + nf(minute(), 2) + ":" + nf(second(), 2);
        this.messages.push({
            time: timestamp,
            text: text
        });

        // Trim if too many messages
        while (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
    }

    processCommand(cmd) {
        cmd = cmd.toLowerCase().trim();

        // Add to history
        this.commandHistory.push(cmd);
        if (this.commandHistory.length > 20) this.commandHistory.shift();
        this.historyIndex = -1;

        if (cmd === "") return;

        this.addMessage("> " + cmd);

        // Process command
        if (cmd === "help") {
            this.addMessage("SYSTEM: Available commands:");
            this.addMessage("  status - Display ship systems status");
            this.addMessage("  scan - Perform sensor sweep");
            this.addMessage("  warp [on/off] - Control warp drive");
            this.addMessage("  shields [on/off] - Control shield systems");
            this.addMessage("  autonav [on/off] - Control navigation");
            this.addMessage("  stealth [on/off] - Control stealth systems");
            this.addMessage("  set course [id] - Set navigation target");
            this.addMessage("  divert power [system] - Reallocate power");
            this.addMessage("  full report - Show all ship systems");
            this.addMessage("  clear - Clear terminal");
        }
        else if (cmd === "status") {
            this.addMessage(`SHIP: Status report`);
            this.addMessage(`  Alert Level: ${["NORMAL", "YELLOW", "RED"][CTRL.alertLevel]}`);
            this.addMessage(`  Hull Integrity: ${(CTRL.shipIntegrity * 100).toFixed(1)}%`);
            this.addMessage(`  Throttle: ${(CTRL.throttle * 100).toFixed(1)}%`);
        }
        else if (cmd === "scan") {
            this.addMessage("SENSORS: Initiating sensor sweep...");
            lastPing = millis();
            sounds.ping.play();
            setTimeout(() => {
                let contacts = floor(random(3, 8));
                this.addMessage(`SENSORS: Sweep complete. ${contacts} contacts detected.`);
                if (CTRL.anomalyDetected) {
                    this.addMessage("SENSORS: WARNING - Quantum anomaly detected!");
                }
            }, 1500);
        }
        else if (cmd === "warp on") {
            CTRL.warp = true;
            sounds.warp.play();
            this.addMessage("ENGINES: Engaging warp drive");
        }
        else if (cmd === "warp off") {
            CTRL.warp = false;
            this.addMessage("ENGINES: Disengaging warp drive");
        }
        else if (cmd === "shields on") {
            CTRL.shields = true;
            sounds.shield.play();
            this.addMessage("DEFENSE: Shield systems online");
        }
        else if (cmd === "shields off") {
            CTRL.shields = false;
            this.addMessage("DEFENSE: Shield systems offline");
        }
        else if (cmd === "autonav on") {
            CTRL.autonav = true;
            this.addMessage("NAV: Auto-navigation engaged");
        }
        else if (cmd === "autonav off") {
            CTRL.autonav = false;
            this.addMessage("NAV: Auto-navigation disengaged");
        }
        else if (cmd === "stealth on") {
            CTRL.stealth = true;
            this.addMessage("DEFENSE: Stealth systems activated");
        }
        else if (cmd === "stealth off") {
            CTRL.stealth = false;
            this.addMessage("DEFENSE: Stealth systems deactivated");
        }
        else if (cmd.startsWith("set course")) {
            let targetId = cmd.split("set course ")[1];
            this.addMessage(`NAV: Setting course to target ${targetId}`);
            CTRL.autonav = true;
            radar.selected = floor(random(radar.targets.length));
        }
        else if (cmd.startsWith("divert power")) {
            let system = cmd.split("divert power ")[1];
            if (["engines", "shields", "sensors", "weapons"].includes(system)) {
                // Reallocate power
                let oldValue = CTRL.powerAllocation[system];
                CTRL.powerAllocation[system] = 0.5;

                // Reduce other systems
                let othersTotal = 1 - 0.5;
                let otherSystems = ["engines", "shields", "sensors", "weapons"].filter(s => s !== system);
                for (let s of otherSystems) {
                    CTRL.powerAllocation[s] = othersTotal / 3;
                }

                this.addMessage(`POWER: Diverting power to ${system.toUpperCase()}`);
                this.addMessage(`POWER: ${system.toUpperCase()} allocation: ${Math.round(CTRL.powerAllocation[system] * 100)}%`);
            } else {
                this.addMessage("POWER: Unknown system. Available: engines, shields, sensors, weapons");
            }
        }
        else if (cmd === "full report") {
            this.addMessage("SYSTEM: Generating full status report...");
            setTimeout(() => {
                this.addMessage("--- SHIP STATUS REPORT ---");
                this.addMessage(`Alert Level: ${["NORMAL", "YELLOW", "RED"][CTRL.alertLevel]}`);
                this.addMessage(`Hull Integrity: ${(CTRL.shipIntegrity * 100).toFixed(1)}%`);
                this.addMessage(`Throttle: ${(CTRL.throttle * 100).toFixed(1)}%`);
                this.addMessage(`Engines: ${CTRL.systemStatus.engines} (${Math.round(CTRL.powerAllocation.engines * 100)}%)`);
                this.addMessage(`Shields: ${CTRL.systemStatus.shields} (${Math.round(CTRL.powerAllocation.shields * 100)}%)`);
                this.addMessage(`Sensors: ${CTRL.systemStatus.sensors} (${Math.round(CTRL.powerAllocation.sensors * 100)}%)`);
                this.addMessage(`Weapons: ${CTRL.systemStatus.weapons} (${Math.round(CTRL.powerAllocation.weapons * 100)}%)`);
                this.addMessage(`Systems: WARP=${CTRL.warp}, SHIELDS=${CTRL.shields}, AUTONAV=${CTRL.autonav}, STEALTH=${CTRL.stealth}`);
            }, 1000);
        }
        else if (cmd === "clear") {
            this.messages = [];
            this.addMessage("SYSTEM: Terminal cleared");
        }
        else {
            this.addMessage("ERROR: Unknown command. Type 'help' for available commands.");
        }
    }

    draw() {
        push();
        // Semi-transparent overlay
        fill(0, 0, 10, 80);
        rect(0, 0, width, height);

        // Terminal window
        let w = min(600, width - 100);
        let h = min(400, height - 100);
        let x = (width - w) / 2;
        let y = (height - h) / 2;

        // Background and frame
        fill(10, 30, 15, 95);
        rect(x, y, w, h, 12);
        neonFrame(x, y, w, h, 12, THEME.neonCyan, 0.5);

        // Terminal content
        let pad = 20;
        let contentWidth = w - pad * 2;
        let inputHeight = 30;
        let outputHeight = h - pad * 2 - inputHeight - 10;

        // Output area
        fill(10, 10, 10, 80);
        rect(x + pad, y + pad, contentWidth, outputHeight, 8);

        // Display messages
        fill(200, 10, 85);
        textSize(12);
        textAlign(LEFT, TOP);
        let messageHeight = 20;
        let visibleMessages = min(floor(outputHeight / messageHeight), this.messages.length);

        for (let i = 0; i < visibleMessages; i++) {
            let msg = this.messages[this.messages.length - visibleMessages + i];

            // Different colors for different message types
            if (msg.text.startsWith("SYSTEM:")) fill(THEME.neonCyan);
            else if (msg.text.startsWith("ERROR:")) fill(THEME.neonRed);
            else if (msg.text.startsWith("SENSORS:")) fill(THEME.neonLime);
            else if (msg.text.startsWith("ENGINES:")) fill(THEME.neonAmber);
            else if (msg.text.startsWith("DEFENSE:")) fill(THEME.neonMagenta);
            else if (msg.text.startsWith("NAV:")) fill(THEME.neonBlue);
            else if (msg.text.startsWith(">")) fill(THEME.white);
            else if (msg.text.startsWith("---")) fill(THEME.neonCyan);
            else fill(200, 10, 85);

            // Draw time prefix
            text(msg.time, x + pad + 5, y + pad + 5 + i * messageHeight);

            // Draw message
            text(msg.text, x + pad + 80, y + pad + 5 + i * messageHeight);
        }

        // Input area
        fill(10, 10, 10, 80);
        rect(x + pad, y + pad + outputHeight + 10, contentWidth, inputHeight, 8);

        // Command prompt
        fill(THEME.neonCyan);
        textAlign(LEFT, CENTER);
        text("> ", x + pad + 10, y + pad + outputHeight + 10 + inputHeight / 2);

        // Input text
        fill(THEME.white);
        text(this.input, x + pad + 25, y + pad + outputHeight + 10 + inputHeight / 2);

        // Cursor blink
        this.cursorBlink = (this.cursorBlink + 1) % 60;
        if (this.cursorBlink < 30) {
            let cursorX = x + pad + 25 + textWidth(this.input.substring(0, this.cursor));
            stroke(THEME.white);
            strokeWeight(1);
            line(cursorX, y + pad + outputHeight + 15, cursorX, y + pad + outputHeight + 5 + inputHeight - 5);
        }

        // Help text
        fill(200, 10, 60);
        textAlign(LEFT, BOTTOM);
        textSize(10);
        text("PRESS [ESC] TO EXIT TERMINAL", x + pad, y + h - 5);

        pop();
    }

    keyPressed(key, keyCode) {
        if (keyCode === ESCAPE) {
            // Exit terminal mode
            terminalMode = false;
            return;
        }

        if (keyCode === BACKSPACE) {
            if (this.cursor > 0) {
                this.input = this.input.substring(0, this.cursor - 1) + this.input.substring(this.cursor);
                this.cursor--;
            }
            return;
        }

        if (keyCode === DELETE) {
            if (this.cursor < this.input.length) {
                this.input = this.input.substring(0, this.cursor) + this.input.substring(this.cursor + 1);
            }
            return;
        }

        if (keyCode === LEFT_ARROW) {
            this.cursor = max(0, this.cursor - 1);
            return;
        }

        if (keyCode === RIGHT_ARROW) {
            this.cursor = min(this.input.length, this.cursor + 1);
            return;
        }

        if (keyCode === UP_ARROW) {
            // Command history navigation
            if (this.commandHistory.length > 0) {
                this.historyIndex = min(this.commandHistory.length - 1, this.historyIndex + 1);
                this.input = this.commandHistory[this.commandHistory.length - this.historyIndex - 1];
                this.cursor = this.input.length;
            }
            return;
        }

        if (keyCode === DOWN_ARROW) {
            // Command history navigation
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input = this.commandHistory[this.commandHistory.length - this.historyIndex - 1];
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                this.input = "";
            }
            this.cursor = this.input.length;
            return;
        }

        if (keyCode === ENTER) {
            this.processCommand(this.input);
            this.input = "";
            this.cursor = 0;
            return;
        }

        // Regular character input
        if (key.length === 1) {
            this.input = this.input.substring(0, this.cursor) + key + this.input.substring(this.cursor);
            this.cursor++;
        }
    }
}

/* ---------- BOTTOM BAR ---------- */

function drawBottom(x, y, w, h) {
    push();
    translate(x, y);

    let leftW = w * 0.58;
    let rightW = w - leftW;
    spectrum.draw(0, 0, leftW, h);

    // Right bottom panel split
    let glyphsW = rightW * 0.6;
    glyphs.draw(leftW, 0, glyphsW, h);

    // Controls panel
    drawToggles(leftW + glyphsW, 0, rightW - glyphsW, h);

    // hover text (if any)
    if (hoverInfo) {
        fill(200, 10, 85);
        textSize(12);
        textAlign(LEFT, BOTTOM);
        text(hoverInfo, 16, h - 12);
    }

    // Terminal hint
    fill(200, 10, 60);
    textAlign(RIGHT, BOTTOM);
    textSize(10);
    text("PRESS [T] FOR TERMINAL", w - 16, h - 12);

    pop();
}

function drawToggles(x, y, w, h) {
    push();
    translate(x, y);

    // Toggle panel background
    neonFrame(8, 8, w - 16, h - 16, 8, THEME.neonCyan, 0.3);

    let items = [
        { label: "WARP (W)", key: 'W', state: CTRL.warp, color: THEME.neonLime },
        { label: "SHIELDS (S)", key: 'S', state: CTRL.shields, color: THEME.neonCyan },
        { label: "AUTONAV (A)", key: 'A', state: CTRL.autonav, color: THEME.neonAmber },
        { label: "STEALTH (D)", key: 'D', state: CTRL.stealth, color: THEME.neonMagenta },
    ];
    let bw = w - 24, bh = 24, gap = 8;
    let startY = 20;

    for (let i = 0; i < items.length; i++) {
        let yy = startY + i * (bh + gap);
        toggleButton(12, yy, bw, bh, items[i]);
    }

    // Power allocations
    let systems = ['engines', 'shields', 'sensors', 'weapons'];
    let powerY = startY + items.length * (bh + gap) + 12;

    fill(200, 10, 85);
    textSize(12);
    textAlign(LEFT, TOP);
    text("POWER ALLOCATION", 12, powerY);

    for (let i = 0; i < systems.length; i++) {
        let sys = systems[i];
        let py = powerY + 24 + i * 22;

        // Label
        fill(200, 10, 75);
        textSize(11);
        textAlign(LEFT, CENTER);
        text(sys.toUpperCase(), 12, py);

        // Bar background
        fill(200, 10, 30);
        rect(90, py - 6, bw - 90, 12, 4);

        // Power level
        let powerColor = sys === 'engines' ? THEME.neonAmber :
            sys === 'shields' ? THEME.neonCyan :
                sys === 'sensors' ? THEME.neonLime :
                    THEME.neonMagenta;

        fill(powerColor);
        rect(90, py - 6, (bw - 90) * CTRL.powerAllocation[sys], 12, 4);

        // Percentage
        fill(0, 0, 100);
        textAlign(CENTER, CENTER);
        text(Math.round(CTRL.powerAllocation[sys] * 100) + "%", 90 + (bw - 90) / 2, py);
    }

    pop();
}

function toggleButton(x, y, w, h, item) {
    let over = (mouseX > x + width * 0.58 + width * 0.42 * 0.6 && mouseX < x + width * 0.58 + width * 0.42 * 0.6 + w && mouseY > y + height - height * 0.22 && mouseY < y + height - height * 0.22 + h);
    neonFrame(x, y, w, h, 6, item.color, item.state ? 0.6 : 0.22);
    fill(item.state ? 0 : 0, 0, item.state ? 100 : 70);
    textAlign(LEFT, CENTER);
    textSize(12);
    text(item.label, x + 10, y + h / 2);

    // Show current state
    textAlign(RIGHT, CENTER);
    text(item.state ? "ONLINE" : "OFFLINE", x + w - 10, y + h / 2);

    if (over) {
        hoverInfo = "Click to toggle " + item.label.split(' ')[0];
        if (mouseIsPressed) {
            if (item.key === 'W') CTRL.warp = !CTRL.warp;
            if (item.key === 'S') CTRL.shields = !CTRL.shields;
            if (item.key === 'A') CTRL.autonav = !CTRL.autonav;
            if (item.key === 'D') CTRL.stealth = !CTRL.stealth;
            sounds.click.play();
        }
    }
}

/* ---------- HUD + EFFECTS ---------- */

function drawCursor() {
    push();
    let x = mouseX, y = mouseY;
    noFill();
    let col = CTRL.stealth ? color(182, 85, 95, 55) : THEME.neonCyan;
    stroke(col);
    strokeWeight(1);

    // Different cursor when over interactive elements
    if (hoverInfo) {
        // Hand cursor
        ellipse(x, y, 16, 16);
        line(x, y - 8, x, y + 8);
        line(x - 8, y, x + 8, y);
    } else {
        // Normal cursor
        line(x - 10, y, x + 10, y);
        line(x, y - 10, x, y + 10);
        ellipse(x, y, 16, 16);
    }
    pop();
}

function drawShieldVignette(shieldColor) {
    push();
    noFill();
    let k = 6;
    let col = color(hue(shieldColor), saturation(shieldColor), brightness(shieldColor), 10);
    stroke(col);

    // Shield fluctuation based on integrity
    let fluctuation = CTRL.shipIntegrity < 0.7 ? (1 - CTRL.shipIntegrity) * 6 : 0;
    let shieldPhase = frameCount * 0.02;

    for (let i = 0; i < k; i++) {
        let distort = fluctuation * sin(i + shieldPhase);
        ellipse(
            width / 2 + distort * 3,
            height / 2 + distort * 2,
            width * 1.2 + i * 8 + sin(shieldPhase + i) * fluctuation * 8,
            height * 1.2 + i * 8 + cos(shieldPhase + i) * fluctuation * 5
        );
    }

    // Add shield impact effects when integrity is low
    if (CTRL.shipIntegrity < 0.8 && random() < 0.02) {
        let angle = random(TAU);
        let dist = min(width, height) * 0.6;
        let x = width / 2 + cos(angle) * dist;
        let y = height / 2 + sin(angle) * dist;

        pings.push(new Ping(x, y, THEME.neonRed));
    }

    pop();
}

function drawScanlines() {
    push();
    noStroke();
    let a = CTRL.stealth ? 10 : 16;
    fill(0, 0, 0, a);
    for (let y = 0; y < height; y += 2) rect(0, y, width, 1);

    // soft vignette
    for (let i = 0; i < 6; i++) {
        fill(0, 0, 0, 10 - i * 1.5);
        rect(i * 2, i * 2, width - i * 4, height - i * 4, 12);
    }

    // Add interference when alert level is high
    if (CTRL.alertLevel > 0) {
        blendMode(OVERLAY);
        for (let i = 0; i < 10; i++) {
            let x = random(width);
            let h = random(20, 100);
            fill(0, 0, 0, CTRL.alertLevel * 20);
            rect(x, 0, random(1, 3), height);
        }
    }

    // Screen flicker during anomalies
    if (CTRL.anomalyDetected && frameCount % 30 === 0) {
        blendMode(SCREEN);
        fill(315, 85, 95, 10);
        rect(0, 0, width, height);
    }

    pop();
}

function panelGlass(x, y, w, h, r, col, opacity, alertColor, alertIntensity) {
    push();
    noStroke();
    fill(hue(col), saturation(col), brightness(col), 18);
    rect(x, y, w, h, r);

    // Alert color overlay
    if (alertIntensity > 0) {
        fill(hue(alertColor), saturation(alertColor), brightness(alertColor), alertIntensity * 15);
        rect(x, y, w, h, r);
    }

    // top sheen
    let g = drawingContext.createLinearGradient(0, y, 0, y + h * 0.5);
    g.addColorStop(0, colorToRgba(color(0, 0, 100, 18)));
    g.addColorStop(1, colorToRgba(color(0, 0, 100, 0)));
    drawingContext.fillStyle = g;
    rect(x + 1, y + 1, w - 2, h * 0.5, r);
    pop();
}

function neonFrame(x, y, w, h, r, col, intensity = 0.5) {
    push();
    noFill();
    let base = color(hue(col), saturation(col), brightness(col), 40);
    stroke(base);
    strokeWeight(1.2);
    rect(x, y, w, h, r);
    // glow
    blendMode(ADD);
    stroke(color(hue(col), saturation(col), brightness(col), 18 * intensity));
    strokeWeight(3);
    rect(x, y, w, h, r);
    pop();
}

function glowCircle(x, y, d, col, intensity = 0.5) {
    push();
    noFill();
    blendMode(ADD);
    for (let i = 4; i >= 1; i--) {
        stroke(color(hue(col), saturation(col), brightness(col), 18 * intensity * i));
        strokeWeight(i * 2);
        ellipse(x, y, d, d);
    }
    pop();
}

function colorToRgba(c) {
    return `rgba(${round(red(c))},${round(green(c))},${round(blue(c))},${alpha(c) / 100})`;
}

/* ---------- ENERGY PINGS ---------- */

function mousePressed() {
    if (!terminalMode) {
        pings.push(new Ping(mouseX, mouseY, CTRL.warp ? THEME.neonLime : THEME.neonAmber));
        sounds.click.play();
    }
}

function keyPressed() {
    if (terminalMode) {
        terminal.keyPressed(key, keyCode);
        return;
    }

    if (key === 'w' || key === 'W') {
        CTRL.warp = !CTRL.warp;
        sounds.warp.play();
    }
    if (key === 's' || key === 'S') {
        CTRL.shields = !CTRL.shields;
        sounds.shield.play();
    }
    if (key === 'a' || key === 'A') CTRL.autonav = !CTRL.autonav;
    if (key === 'd' || key === 'D') CTRL.stealth = !CTRL.stealth;
    if (key === ' ') {
        lastPing = millis();
        pings.push(new Ping(width * 0.19, height * 0.47, THEME.neonCyan));
        sounds.ping.play();
    }
    if (key === 't' || key === 'T') {
        terminalMode = true;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Ping {
    constructor(x, y, col) {
        this.x = x; this.y = y; this.col = col;
        this.age = 0; this.life = 1.2;
    }
    draw() {
        let k = this.age / this.life;
        let r = easeOutCubic(k) * max(width, height) * 0.6;
        noFill();
        for (let i = 0; i < 3; i++) {
            stroke(color(hue(this.col), saturation(this.col), brightness(this.col), 60 - i * 18));
            strokeWeight(2 - i * 0.6);
            ellipse(this.x, this.y, r * (1 - i * 0.12));
        }
    }
}

/* ---------- UTILS ---------- */

function easeOutCubic(x) { return 1 - pow(1 - x, 3); }