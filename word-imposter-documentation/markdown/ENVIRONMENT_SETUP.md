# Environment Setup
**Version:** 1.0

## 1. Required tools
- Git.
- Supported Node.js LTS.
- npm/pnpm/yarn (select one and commit lockfile).
- MongoDB local instance or Atlas development cluster.
- Code editor with TypeScript support.
- Browser profiles for multi-player testing.

## 2. Environment files
Maintain separate client and server environment files. Commit `.env.example`, never `.env`. Validate server variables at startup. Avoid putting server secrets in `VITE_*` variables because client variables are bundled into browser code.

## 3. Suggested setup sequence
1. Clone repository.
2. Install dependencies from lockfile.
3. Copy example environment files.
4. Configure MongoDB URI and allowed client origin.
5. Start database.
6. Run index/migration setup.
7. Import reviewed word-pair CSV and inspect validation report.
8. Start backend.
9. Start frontend.
10. Open at least three isolated browser sessions and test room creation/joining.

## 4. Dataset import checklist
- Confirm exact CSV headers match approved schema.
- Confirm UTF-8 encoding.
- Parse tags deterministically.
- Validate enum values and relatedness range.
- Detect direct and reversed duplicates.
- Reject empty words and identical word1/word2.
- Check Roman Hindi transliteration and Indian cultural context.
- Keep `hint` private.
- Produce accepted/rejected row report.

## 5. Troubleshooting
Document actual package scripts and provider-specific commands in README after repository initialization. Do not invent commands that do not exist in package.json.
