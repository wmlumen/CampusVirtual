import os
from bs4 import BeautifulSoup
import re

def main():
    with open('Materiales_Clases/Unidad_05.html', 'r', encoding='latin-1') as f:
        soup5 = BeautifulSoup(f, 'html.parser')

    with open('Materiales_Clases/Unidad_01.html', 'r', encoding='latin-1') as f:
        soup1 = BeautifulSoup(f, 'html.parser')

    print("Parsed both files successfully")

if __name__ == '__main__':
    main()
