# 🚀 SpaceCraft P5 - Advanced Starship Control Panel

An immersive, interactive starship control panel simulation built with p5.js. Experience commanding a futuristic spacecraft with real-time radar, quantum core monitoring, holographic displays, and voice-controlled terminal commands.

![SpaceCraft Control Panel](https://img.shields.io/badge/Status-Operational-brightgreen) ![p5.js](https://img.shields.io/badge/p5.js-1.7.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎛️ Control Systems
- **WARP Drive** - Engage faster-than-light travel
- **SHIELDS** - Defensive energy barriers with visual effects
- **AUTONAV** - Automated navigation system
- **STEALTH** - Cloaking technology
- **Throttle Control** - Interactive engine power management

### 📡 Visual Components
- **Real-time Radar** - 360° scanning with contact detection
- **Quantum Core** - Animated energy reactor with particle effects
- **Holographic Display** - 3D rotating ship projection
- **Spectrum Analyzer** - Audio-visual frequency monitoring
- **Signal Grid** - Data transmission visualization
- **Starfield** - Dynamic parallax star movement

### 🖥️ Interactive Terminal
- Voice-command simulation
- System status reports
- Course plotting
- Power allocation controls
- Real-time system diagnostics

### 🎨 Visual Effects
- Neon cyberpunk aesthetic
- Dynamic alert states (Normal/Yellow/Red)
- Particle systems and energy ripples
- Scanline overlay effects
- Responsive parallax movement

## 🎮 Controls

### Keyboard Commands
| Key | Function |
|-----|----------|
| `W` | Toggle WARP drive |
| `S` | Toggle SHIELDS |
| `A` | Toggle AUTONAV |
| `D` | Toggle STEALTH mode |
| `Space` | Send RADAR ping |
| `T` | Focus command terminal |
| `ESC` | Exit terminal mode |

### Mouse Interactions
- **Click anywhere**: Spawn energy ripple effects
- **Drag core ring**: Adjust throttle power
- **Drag hologram**: Rotate 3D ship projection
- **Hover elements**: Display system information

### Terminal Voice Commands
Type these commands in the terminal (press `T` to focus):
- `help` - Display available commands
- `scan` - Perform sector scan
- `status` - System status report
- `warp on/off` - Control warp drive
- `shields on/off` - Control defensive shields
- `autonav on/off` - Toggle auto-navigation
- `stealth on/off` - Toggle stealth mode
- `set course [number]` - Plot navigation course
- `divert power [system]` - Reallocate power
- `full report` - Comprehensive system analysis

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)
1. Visit the live demo: **[SpaceCraft P5 Control Panel](https://vulbsti.github.io/SpaceCraftP5/)**
2. Wait for systems to initialize
3. Use keyboard/mouse controls to interact with the interface

### Option 2: Local Development
1. Clone this repository:
   ```bash
   git clone https://github.com/vulbsti/SpaceCraftP5.git
   cd SpaceCraftP5
   ```

2. Serve the files using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Option 3: p5.js Web Editor
1. Copy the contents of `root/controlpanel.js`
2. Go to [editor.p5js.org](https://editor.p5js.org)
3. Paste the code and run

## 🌐 GitHub Pages Deployment

This project is automatically deployed to GitHub Pages. To deploy your own fork:

1. **Fork this repository** to your GitHub account

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Set source to "Deploy from a branch"
   - Select `main` branch and `/ (root)` folder
   - Save the settings

3. **Access your deployment**:
   - Your control panel will be available at: `https://[username].github.io/SpaceCraftP5/`
   - GitHub will provide the exact URL in the Pages settings

4. **Custom Domain** (Optional):
   - Add a `CNAME` file to the repository root
   - Configure your domain's DNS settings

## 🛠️ Technical Details

### Dependencies
- **p5.js v1.7.0** - Creative coding library
- **Web Audio API** - Sound simulation (placeholder implementation)
- **Canvas API** - Hardware-accelerated rendering

### Browser Compatibility
- Chrome 80+ ✅
- Firefox 75+ ✅
- Safari 13+ ✅
- Edge 80+ ✅

### Performance
- Optimized for 60 FPS
- Responsive design (adapts to screen size)
- Hardware-accelerated rendering
- Efficient particle systems

## 📁 Project Structure

```
SpaceCraftP5/
├── index.html              # Main HTML file with p5.js integration
├── controlpanel.js         # Complete starship control panel code
├── LICENSE                 # MIT License
└── README.md              # Project documentation
```

## 🎨 Customization

### Color Themes
The control panel uses a cyberpunk color scheme defined in the `THEME` object:
- Neon Cyan: Primary UI elements
- Neon Magenta: Accent colors
- Neon Amber: Warning states
- Neon Red: Alert conditions

### Adding New Systems
To add new ship systems:
1. Add to `CTRL` object in the main code
2. Create corresponding visual components
3. Add keyboard shortcuts in `keyPressed()`
4. Include terminal commands in the `Terminal` class

### Sound Integration
Replace the placeholder sound objects with actual audio files:
```javascript
// In preload() function
sounds.beep = loadSound('assets/beep.wav');
sounds.warp = loadSound('assets/warp.wav');
// etc.
```

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional ship systems
- Sound effects integration
- Mobile touch controls
- Multiplayer capabilities
- Save/load configurations

## 📄 Licensce 

Do VibeCoded apps even need a license? 🤔

## 🙏 Acknowledgments

- Built with [p5.js](https://p5js.org/) creative coding framework
- Inspired by science fiction control interfaces
- Cyberpunk aesthetic influences

---

**Status**: Operational ✅ | **Last Updated**: July 2025 | **Version**: 2.0

*Engage your imagination and take command of the starship!* 🌟
