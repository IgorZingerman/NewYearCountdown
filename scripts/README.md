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
7. **Optional SFTP deployment** - Prints two rsync commands, a dry run (copied to the clipboard) and the real upload, with the same safety settings as the GitHub deploy

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

The script will then print two `rsync` commands and copy the first one to your clipboard:

1. **A dry run** (`rsync -n`): changes nothing and lists what would change. Lines starting with `*deleting` are files that would be removed from the server.
2. **The upload**: run it only once the dry run looks right.

Both use the same safety settings as the GitHub deploy: deletions happen only after a successful upload, the upload stops if more than 50 files would be deleted, the host's own folders (`.well-known`, `cgi-bin`, `stats`, `logs`) are never touched, and SSH must already know the server's host key (`StrictHostKeyChecking=yes`). If SSH says "Host key verification failed", check the fingerprint with `ssh-keyscan <host> | ssh-keygen -lf -`, compare it with the one your host publishes, then connect once with `ssh <user>@<host>` to save it. The script also refuses remote paths like `/`, `~` or anything with `..`.

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

