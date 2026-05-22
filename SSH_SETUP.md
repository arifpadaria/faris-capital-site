# 🔐 Setting Up SSH for GitHub (Optional but Recommended)

The publishing tool works better with SSH because it won't prompt for your password every time you push. Here's how to set it up.

## Quick Setup (5 minutes)

### 1. Check if you already have SSH keys

```bash
ls -la ~/.ssh/
```

Look for `id_rsa` and `id_rsa.pub`. If they exist, skip to step 3.

### 2. Generate SSH keys (if needed)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

Press Enter when prompted (no passphrase needed for automation).

### 3. Add your SSH key to GitHub

Copy your public key:

```bash
cat ~/.ssh/id_rsa.pub
```

Then:
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the content
4. Click "Add SSH key"

### 4. Update your git remote to use SSH

```bash
cd /Users/arifpadaria/Documents/faris-capital-site
git remote set-url origin git@github.com:arifpadaria/faris-capital-site.git
```

Verify it worked:

```bash
git remote -v
```

You should see `git@github.com:...` instead of `https://...`

## Done!

Now `git push` won't ask for your password. Try the publisher again:

```bash
node scripts/publish.js
```

---

## Why SSH?

- ✓ No password prompts
- ✓ More secure (uses public-key cryptography)
- ✓ Faster (no credential lookup)
- ✓ Works with `git push` in scripts

## If You Prefer HTTPS

GitHub no longer accepts passwords for HTTPS pushes. Use a **Personal Access Token** instead:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select `repo` scope
4. Copy the token
5. Run: `git config --global credential.helper osxkeychain`
6. Next git push will prompt for "password" — paste the token

---

**Questions?** Check GitHub's [SSH documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).
