# -*- coding: utf-8 -*-
"""
fix_all.py — conserta mojibake de UTF-8 lido como Windows-1252 (cp1252)
nos arquivos .ejs, incluindo os casos "de duas camadas" causados por uma
versão anterior deste script.

DIAGNÓSTICO
-----------
1) Corrupção original: os .ejs foram salvos em UTF-8 corretamente, mas em
   algum momento um editor/terminal/script leu esses bytes como cp1252 e
   regravou o resultado como UTF-8. Isso corrompe todo caractere não-ASCII
   de forma sistemática e, em geral, reversível (á, ã, ç, ⭐, 🎬, 👤 etc.).

2) Corrupção extra ("camada 2"): uma versão anterior deste fix_all.py usava
   um dicionário de strings fixas para consertar alguns emojis manualmente.
   O problema é que vários emojis diferentes compartilham o mesmo PREFIXO
   bruto de mojibake:
     - qualquer emoji de 4 bytes (👤 🎬 📅 📜 🤍 🛡️ ...) começa, quando lido
       errado como cp1252, com os mesmos 2 caracteres "ðŸ";
     - vários símbolos de 3 bytes na faixa U+26xx (⚙️ ⚡ ...) começam com "âš".
   O dicionário antigo trocava esse PREFIXO inteiro por um emoji fixo (ex.:
   "ðŸ" -> "👤", "âš" -> "⚡"), o que corrigia só o caso testado e ESTRAGAVA
   todos os outros emojis que só compartilhavam o prefixo, deixando lixo
   colado depois (ex.: "👤Ž¬" em vez de restaurar "🎬").

3) Bytes "perdidos": o cp1252 tem 5 posições indefinidas (0x81, 0x8D, 0x8F,
   0x90, 0x9D). Quem gerou a corrupção não deu erro nessas posições — em vez
   disso caiu para um mapeamento de identidade (valor do byte == code point),
   deixando um caractere de controle literal (ex. \\x8f) no meio do texto.
   Isso não é perda de dado: o byte original continua recuperável.

CORREÇÃO
--------
Em vez de um dicionário de strings fixas (que sempre vai deixar passar casos
novos), a função abaixo:
  a) desfaz a substituição de prefixo da "camada 2" quando encontra 👤/⚡
     grudados em mais caracteres quebrados;
  b) reconstrói os bytes originais caractere a caractere (usando o mapeamento
     cp1252 normal, e o fallback de identidade para os 5 slots indefinidos);
  c) decodifica esses bytes como UTF-8 para restaurar o caractere original.
Se qualquer etapa falhar, o trecho é deixado como está (não mexe em texto
que já esteja correto, como acentos do português ou emojis já íntegros).
"""
import glob
import re


def _reverse_char_to_byte(ch: str):
    """Devolve o byte cp1252 original de 1 caractere de mojibake, ou None
    se não for um caractere que possa ter vindo de cp1252."""
    try:
        return ch.encode('cp1252')[0]
    except UnicodeEncodeError:
        cp = ord(ch)
        if 0x80 <= cp <= 0x9F:
            # slot indefinido em cp1252: o conversor com bug usou o próprio
            # code point como byte (ver item 3 do diagnóstico acima).
            return cp
        return None


def _try_reverse_chunk(chunk: str) -> str:
    working = chunk
    # desfaz a substituição de prefixo "camada 2" (só quando sobrou lixo
    # grudado depois do emoji — um 👤 ou ⚡ sozinho já está correto).
    if len(working) > 1:
        if working[0] == '👤':
            working = 'ðŸ' + working[1:]
        elif working[0] == '⚡':
            working = 'âš' + working[1:]

    raw = bytearray()
    for ch in working:
        b = _reverse_char_to_byte(ch)
        if b is None:
            return chunk
        raw.append(b)

    try:
        return bytes(raw).decode('utf-8')
    except UnicodeDecodeError:
        return chunk


def demojibake(text: str, _depth: int = 0) -> str:
    fixed = re.sub(r'[^\x00-\x7F]+', lambda m: _try_reverse_chunk(m.group(0)), text)
    if fixed != text and _depth < 4:
        fixed = demojibake(fixed, _depth + 1)
    return fixed


def find_files():
    files = glob.glob('catalogo-service/views/**/*.ejs', recursive=True)
    if not files:
        files = glob.glob('**/*.ejs', recursive=True)
    return files


def main():
    files = find_files()
    changed = 0

    for file_path in files:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            original = f.read()

        content = demojibake(original)

        if '<head>' in content and '<meta charset="UTF-8">' not in content \
                and '<meta charset="utf-8">' not in content:
            content = content.replace('<head>', '<head>\n  <meta charset="UTF-8">', 1)

        if content != original:
            changed += 1
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"  corrigido: {file_path}")

    print(f"\n✅ {changed}/{len(files)} arquivo(s) corrigido(s).")


if __name__ == '__main__':
    main()