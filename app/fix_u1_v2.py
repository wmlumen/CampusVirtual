with open('Materiales_Clases/Unidad_01.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('[class*="menu-clase"]', ".menu' + '-clase")

with open('Materiales_Clases/Unidad_01.html', 'w', encoding='utf-8') as f:
    f.write(c)
