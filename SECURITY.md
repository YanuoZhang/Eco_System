# 🔒 Security Guide

This document outlines the security measures implemented in the Eco_System project.

## Snyk Dependency Scanning

We use [Snyk](https://snyk.io/) for continuous security monitoring of our dependencies.

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Authenticate with Snyk (optional but recommended):**
   ```bash
   npx snyk auth
   ```
   This allows you to:
   - Monitor dependencies continuously
   - Get detailed vulnerability reports
   - Access Snyk's fix suggestions

### Available Commands

#### Root Level Commands
```bash
# Run security audit for all workspaces
npm run security:audit

# Monitor dependencies (requires authentication)
npm run security:monitor

# Interactive vulnerability fix wizard
npm run security:fix

# Comprehensive security scan
npm run security:scan

# Scan all workspaces individually
npm run security:scan:all
```

#### Workspace Level Commands
```bash
# Backend security audit
npm --workspace ecopath-backend run security:audit

# Frontend security audit
npm --workspace ecopath-frontend run security:audit
```

### Configuration Files

- **`.snyk`** - Snyk policy file for ignoring/patching vulnerabilities
- **`.snykrc`** - Snyk CLI configuration
- **`scripts/security-scan.sh`** - Comprehensive security scanning script

### CI/CD Integration

Security scanning is automatically run:
- **Pre-commit hooks** - Prevents commits with vulnerabilities
- **GitHub Actions CI** - Runs on every push and PR
- **Pull Request checks** - Must pass before merging

### Vulnerability Management

#### Ignoring Vulnerabilities
To ignore a specific vulnerability, add it to `.snyk`:

```yaml
ignore:
  SNYK-JS-LODASH-567746:
    - '*':
        reason: No fix available yet
        expires: '2024-12-31T23:59:59.999Z'
```

#### Patching Vulnerabilities
To patch a vulnerability, add it to `.snyk`:

```yaml
patch:
  SNYK-JS-LODASH-567746:
    - lodash:
        patched: '2024-01-01T00:00:00.000Z'
```

### Best Practices

1. **Regular Scans**: Run `npm run security:scan` regularly
2. **Stay Updated**: Keep dependencies updated
3. **Review Reports**: Check Snyk reports for new vulnerabilities
4. **Fix Promptly**: Address high and critical vulnerabilities immediately
5. **Document Decisions**: Document why vulnerabilities are ignored

### Troubleshooting

#### Common Issues

1. **Authentication Required**
   ```bash
   npx snyk auth
   ```

2. **Outdated Snyk CLI**
   ```bash
   npm update snyk
   ```

3. **False Positives**
   - Add to `.snyk` ignore list
   - Document the reason

4. **Scan Failures**
   - Check network connectivity
   - Verify Snyk service status
   - Review `.snykrc` configuration

### Security Levels

- **Critical**: Fix immediately
- **High**: Fix within 24 hours
- **Medium**: Fix within 1 week
- **Low**: Fix within 1 month

### Monitoring

When authenticated, Snyk provides:
- Email notifications for new vulnerabilities
- Dashboard with project overview
- Historical vulnerability tracking
- Integration with GitHub for PR checks

### Support

- [Snyk Documentation](https://docs.snyk.io/)
- [Snyk CLI Reference](https://docs.snyk.io/features/cli)
- [Vulnerability Database](https://snyk.io/vuln)
