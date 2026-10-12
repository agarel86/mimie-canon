from pathlib import Path

root = Path(__file__).resolve().parent
text = (root / "build-words.mjs").read_text(encoding="utf-8")
text = text[text.index("const bank = [];") :]
if "process.exit(1);" not in text:
    raise SystemExit("process.exit missing")
text = text.replace(
    "process.exit(1);",
    "throw new Error('Banque de mots invalide');",
)
marker = "const body = words"
if marker not in text:
    raise SystemExit("marker missing")
text = text[: text.index(marker)]
text += (
    "window.WORD_BANK = words;\n"
    "window.WORD_BANK_INFO = { count: words.length, byD: byD, verbs: verbs };\n"
    "console.log('Mots', words.length, byD, 'conjugaison', verbs);\n"
)
(root / "bank.js").write_text(
    "/* Banque CE2 executee dans le navigateur. */\n" + text,
    encoding="utf-8",
)
for token in ("process.", "writeFileSync", "import ", "require("):
    if token in text:
        raise SystemExit("token still present: " + token)
print("bank.js", len(text))
