# Deployment Scripts

## deploy.sh

Builds the Next.js application for static export to Apache.

### Usage

```bash
# Run directly
./scripts/deploy.sh

# Or via npm script
npm run deploy
```

### What it does

1. **Checks dependencies** - Installs npm packages if `node_modules` is missing
2. **Cleans previous builds** - Removes `.next` and `out` directories
3. **Runs linter** - Checks code quality (continues on warnings)
4. **Builds the application** - Runs Next.js static export build
5. **Verifies output** - Ensures `out` directory and required files exist
6. **Copies .htaccess** - Ensures Apache configuration is included
7. **Optional SFTP deployment** - Generates rsync command and copies it to clipboard for manual deployment

### Configuration (.env file)

**Required:** You must create a `.env` file in the project root to set default deployment settings. Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your deployment settings:
```
DEPLOY_HOST=your-server.example.com
DEPLOY_USER=your-username
DEPLOY_PATH=/path/to/your/webroot
```

The `.env` file is gitignored and won't be committed to the repository. **No sensitive information is stored in the script itself.**

### Interactive SFTP Deployment

After building, the script will ask if you want to deploy via SFTP/SCP. If you choose yes, it will prompt for:

- **Host** (defaults from `.env` file if set, otherwise required)
- **Username** (defaults from `.env` file if set, otherwise required)
- **Remote path** (defaults from `.env` file if set, otherwise required)

The script will then generate an `rsync` command and copy it to your clipboard. You can paste and run the command manually, which will prompt you for your password securely.

### Output

The script creates a static export in the `out/` directory. If you choose to deploy, it generates an rsync command and copies it to your clipboard for you to run manually.

### Requirements

- Node.js and npm installed
- All dependencies installed (`npm install`)
- Apache server with `mod_rewrite` enabled (for deployment)

### Clipboard Support

The script attempts to copy the rsync command to your clipboard using:
- **pbcopy** (macOS) - built-in
- **xclip** (Linux) - may need to be installed
- **xsel** (Linux) - alternative to xclip

If clipboard tools are not available, the command will still be displayed for manual copying.

