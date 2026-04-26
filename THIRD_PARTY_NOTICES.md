# Third-party notices

This project ports code from upstream open-source projects under their original
licenses. The vendored sources live in `repos/` (gitignored — refresh via
`scripts/vendor-tweakcc.sh`); attribution and license text live here.

---

## tweakcc

- Upstream: https://github.com/Piebald-AI/tweakcc
- Vendored at commit: `303b7560290679127f3d32a6e42c66272d6f0c01`
- License: MIT

cc-mirror ports the binary-patching anchor patterns and minified-name finders
from tweakcc into `src/core/binary-patcher/`. Each ported file carries an
`// Adapted from tweakcc <SHA> src/<path>` header. The upstream MIT terms
follow:

```
MIT License

Copyright (c) 2025 Piebald LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
