import re

with open('Materiales_Clases/Unidad_01.html', 'r', encoding='utf-8') as f:
    c = f.read()

checks = [
    ('R1 h2==1', len(re.findall(r'<h2', c)) == 1),
    ('R2 strong: >=8', len(re.findall(r'<strong>[^<]*:</strong>', c)) >= 8),
    ('R5 table>=1', len(re.findall(r'<table', c)) >= 1),
    ('R6 card>=2', len(re.findall(r'card shadow-sm border-start border-4', c)) >= 2),
    ('R8 bib SI/SI', bool(re.search('Bibliografía Básica', c)) and bool(re.search('Bibliografía Complementaria', c))),
    ('R9 sigla>=5', len(re.findall(r'data-bs-toggle="tooltip"', c)) >= 5),
    ('R10 id>=5 href>=3', len(re.findall(r'id="def-', c)) >= 5 and len(re.findall(r'href="#def-', c)) >= 3),
    ('R12 menu==10', len(re.findall(r'menu-clase', c)) == 10),
    ('R15 nav SI', bool(re.search('Unidad Anterior', c))),
    ('R17 ML>=8 FIN SI', len(re.findall(r'Marcar como Leído', c)) >= 8 and bool(re.search('Confirmar Lección', c)))
]

for name, res in checks:
    print(f'{name}: {"OK" if res else "FAIL"}')
