# External Repositories for Auditing

This directory contains external repositories that are being audited or analyzed.

## Usage

### Adding a Repository for Audit

1. **Clone Method**:
   ```bash
   cd external-repos
   git clone https://github.com/username/repo-name.git
   ```

2. **Submodule Method** (from DirectoryBolt root):
   ```bash
   git submodule add https://github.com/username/repo-name.git external-repos/repo-name
   ```

3. **Copy Method**:
   - Copy repository files directly into a subdirectory

### Current Repositories

- (None currently - add repositories as needed)

## Notes

- External repositories are gitignored by default
- Audit reports are generated in `/audit-reports/`
- Each repository should be in its own subdirectory
- Remove repositories after auditing to keep DirectoryBolt clean