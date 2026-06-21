import os, sys, docx

sys.stdout.reconfigure(encoding='utf-8')

# Find the file
files = [f for f in os.listdir('f:/') if f.endswith('.docx')]
print("All docx files:", file=sys.stderr)
for f in files:
    print(repr(f), file=sys.stderr)

target = None
for f in files:
    if '\u0425\u0443\u0440\u0442\u0430\u0436\u0438\u0435\u0432' in f and '\u0416\u0430\u043b\u0430\u043b-\u0410\u0431\u0430\u0434' in f:
        target = f
        break

if not target:
    for f in files:
        if 'docx' in f.lower() and len(f) > 20:
            target = f
            break

if not target:
    print("No file found", file=sys.stderr)
    sys.exit(1)

path = os.path.join('f:/', target)
print(f"Reading: {repr(path)}", file=sys.stderr)

doc = docx.Document(path)
full_text = []
for para in doc.paragraphs:
    if para.text.strip():
        full_text.append(para.text.strip())

text = '\n'.join(full_text)
with open('fuck_doc_text.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Written {len(text)} chars", file=sys.stderr)
