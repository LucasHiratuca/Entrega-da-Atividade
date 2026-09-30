import subprocess

test_typ = """
#set page(paper: "a4", margin: 2.5cm)
#set text(lang: "pt", font: "Libertinus Serif", size: 10.5pt)
= Teste
Olá mundo do Typst!
"""
with open('test_typ.typ', 'w', encoding='utf-8') as f:
    f.write(test_typ)

res = subprocess.run(['typst', 'compile', 'test_typ.typ', 'test_typ.pdf'], capture_output=True, text=True)
print('STDOUT:', res.stdout)
print('STDERR:', res.stderr)
print('RETURN:', res.returncode)
