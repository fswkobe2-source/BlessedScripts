# Blessed Scripts Launcher

A modern Electron-based launcher for Blessed Scripts with full Jagex account integration.

## Features

- **Jagex Account Integration**: Authenticate and manage multiple Jagex accounts
- **OAuth Authentication**: Secure OAuth2 flow with Jagex authentication servers
- **Account Selection**: Choose from multiple saved Jagex accounts
- **Client Configuration**: Configure RAM allocation and client settings
- **Modern UI**: Clean, responsive interface built with modern web technologies
- **Auto-Launch**: Automatically launches Blessed Scripts with selected account credentials

## Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.org/) (comes with Node.js)

## Installation

1. Clone or download the Blessed Scripts Launcher
2. Navigate to the launcher directory:
   ```bash
   cd blessedlauncher
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Launcher

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Building for Distribution

### Windows
```bash
# Build for Windows (both 32-bit and 64-bit)
npm run build:win

# Build only 64-bit
npm run build:win-x64

# Build only 32-bit
npm run build:win-ia32
```

The built executables will be in the `dist/` directory.

## How It Works

### Authentication Flow

1. **OAuth Authentication**: When you click "Add Jagex Account", the launcher opens a secure browser window using Playwright
2. **Jagex Login**: You log in through Jagex's official OAuth2 authentication system
3. **Token Exchange**: The launcher exchanges the authorization code for an ID token
4. **Session Creation**: Uses the ID token to create a game session with Jagex's API
5. **Account Retrieval**: Fetches all available Jagex accounts associated with your session
6. **Local Storage**: Stores account information securely in `~/.blessedscripts/accounts.json`

### Account Management

- **Storage**: Accounts are stored in `~/.blessedscripts/accounts.json`
- **Session Data**: Each account includes session ID, display name, and account ID
- **Auto-Refresh**: Launcher monitors for changes and refreshes account list automatically
- **Security**: All authentication tokens are handled securely through official Jagex APIs

### Client Integration

When you launch Blessed Scripts:

1. **Account Selection**: Choose your desired Jagex account from the sidebar
2. **Session Creation**: Creates a session file with the selected account's credentials
3. **Client Launch**: Starts the Blessed Scripts client with appropriate JVM arguments
4. **Auto-Login**: The client reads the session file and automatically logs in with the selected account

## File Structure

```
blessedlauncher/
├── main.js                 # Electron main process
├── preload.js              # Electron preload script
├── index.html              # Main UI
├── renderer.js             # Frontend logic
├── package.json            # Dependencies and scripts
├── libs/                   # Backend modules
│   ├── ipc-handlers.js     # IPC communication handlers
│   ├── oauth-jagex.js      # Jagex OAuth implementation
│   ├── accounts-loader.js  # Account management
│   └── client-executor.js  # Client launching logic
├── images/                 # Icons and assets
└── README.md               # This file
```

## Security Notes

- **Official APIs**: Uses only official Jagex authentication APIs
- **Secure Storage**: Account data is stored locally and encrypted
- **No Credentials**: No passwords or sensitive data are stored
- **Session Tokens**: Uses temporary session tokens that expire
- **OAuth Standard**: Follows OAuth2 security best practices

## Troubleshooting

### Authentication Issues

- Ensure you have an active internet connection
- Check that Jagex authentication services are available
- Try refreshing the account list
- Remove and re-add problematic accounts

### Client Launch Issues

- Verify the Blessed Scripts JAR file is valid
- Check that you have sufficient RAM allocated
- Ensure Java is properly installed and configured
- Try different RAM allocation settings

### General Issues

- Check the console logs for error messages
- Ensure all dependencies are properly installed
- Verify file permissions in the `.blessedscripts` directory
- Try restarting the launcher

## Development

### Adding New Features

1. **Frontend**: Modify `renderer.js` and `index.html`
2. **Backend**: Add new modules in `libs/` directory
3. **IPC Communication**: Update `preload.js` and `ipc-handlers.js`

### Debug Mode

Run in debug mode to see developer tools:
```bash
npm run dev
```

## License

MIT License - see LICENSE file for details.

## Support

For support and updates:
- Check the Blessed Scripts documentation
- Report issues on the Blessed Scripts repository
- Join the Blessed Scripts community Discord
