# Pull Request Policy

Thanks for wanting to improve cc-mirror.

This repository is currently maintained as issues-first. External pull requests are not accepted or merged because provider compatibility, binary patching, and release safety need to be implemented directly by the maintainer.

Please open an issue instead with:

- the problem or provider you want supported
- docs or API references
- reproduction steps or expected behavior
- any patch notes, branch links, or code you want considered as reference

External PRs may be closed automatically, but the idea can still be tracked through an issue.

## Maintainer Checklist

- [ ] This change is maintainer-authored or pre-approved
- [ ] Related issue or maintainer decision is linked
- [ ] `npm run check` passes
- [ ] User-facing docs or release notes are updated when needed
