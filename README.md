# FortiConverter

A modern web application for converting FortiAnalyzer traffic logs into FortiGate CLI configuration scripts.

## Features

- 📁 Process large CSV files (>2GB) efficiently
- 🔄 Real-time conversion and preview
- 🌓 Dark/Light mode support
- 🔍 Advanced filtering options
- 🔒 Private IP filtering
- 📊 Paginated results view
- 💾 Separate downloads for:
  - Address objects
  - Service objects
  - Firewall policies

## Installation

### Prerequisites

- Node.js 16 or higher ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/downloads))

### Windows

1. Install Node.js and Git
   ```powershell
   # Using winget
   winget install OpenJS.NodeJS
   winget install Git.Git

   # Or download installers from their websites
   ```

2. Clone and set up the project
   ```powershell
   # Open PowerShell and run:
   git clone https://github.com/yourusername/forti-converter.git
   cd forti-converter
   npm install
   ```

3. Start the application
   ```powershell
   npm run dev
   ```

### macOS

1. Install Node.js and Git
   ```bash
   # Using Homebrew
   brew install node
   brew install git

   # Or using MacPorts
   port install nodejs18
   port install git
   ```

2. Clone and set up the project
   ```bash
   git clone https://github.com/yourusername/forti-converter.git
   cd forti-converter
   npm install
   ```

3. Start the application
   ```bash
   npm run dev
   ```

### Linux (Ubuntu/Debian)

1. Install Node.js and Git
   ```bash
   # Add NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -

   # Install packages
   sudo apt-get install -y nodejs git
   ```

2. Clone and set up the project
   ```bash
   git clone https://github.com/yourusername/forti-converter.git
   cd forti-converter
   npm install
   ```

3. Start the application
   ```bash
   npm run dev
   ```

### Linux (Fedora/RHEL)

1. Install Node.js and Git
   ```bash
   # Add NodeSource repository
   curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -

   # Install packages
   sudo dnf install -y nodejs git
   ```

2. Clone and set up the project
   ```bash
   git clone https://github.com/yourusername/forti-converter.git
   cd forti-converter
   npm install
   ```

3. Start the application
   ```bash
   npm run dev
   ```

## Usage

1. Click "Advanced Mode" for additional options (optional)
2. Upload your FortiAnalyzer CSV log file
3. Wait for processing to complete
4. Review the generated configurations
5. Download the desired CLI scripts

## Advanced Features

- Customize naming conventions for objects and policies
- Filter public/private IP addresses
- Adjust items per page in results view
- Group policies by destination IP and port
- Combine multiple sources into single policies

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technical Details

- Built with SvelteKit and Tailwind CSS
- Efficient stream processing for large files
- Memory-optimized batch processing
- Real-time progress tracking
- Error handling with detailed feedback

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**
   ```bash
   # Check Node.js version
   node --version
   
   # If needed, install nvm to manage Node.js versions
   # Windows: Use nvm-windows
   # Mac/Linux:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Port already in use**
   ```bash
   # Find and kill process using port 3000
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Mac/Linux:
   lsof -i :3000
   kill -9 <PID>
   ```

3. **Permission issues**
   ```bash
   # Fix npm permissions
   sudo chown -R $USER:$GROUP ~/.npm
   sudo chown -R $USER:$GROUP ~/.config
   ```

## Requirements

- Node.js 16+
- Modern web browser with JavaScript enabled
- CSV files from FortiAnalyzer logs

## License

MIT License - See LICENSE file for details 