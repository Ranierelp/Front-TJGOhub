#!/bin/bash

# Script para gerar ícones PWA a partir de um ícone SVG ou PNG
# Certifique-se de ter o ImageMagick instalado: sudo apt install imagemagick

# Diretório dos ícones
ICONS_DIR="public/icons"
INPUT_ICON="$ICONS_DIR/icon-template.png"

# Tamanhos dos ícones necessários
SIZES=(72 96 128 144 152 192 384 512)

echo "Gerando ícones PWA..."

# Verificar se o arquivo de entrada existe
if [ ! -f "$INPUT_ICON" ]; then
    echo "Erro: Arquivo de entrada $INPUT_ICON não encontrado!"
    echo "Por favor, coloque seu ícone principal em $INPUT_ICON"
    exit 1
fi

# Verificar se o ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "Erro: ImageMagick não está instalado!"
    echo "Instale com: sudo apt install imagemagick"
    exit 1
fi

# Gerar ícones em diferentes tamanhos
for size in "${SIZES[@]}"; do
    output_file="$ICONS_DIR/icon-${size}x${size}.png"
    echo "Gerando $output_file..."
    convert "$INPUT_ICON" -resize "${size}x${size}" "$output_file"
done

# Gerar favicon.ico (múltiplos tamanhos em um arquivo)
echo "Gerando favicon.ico..."
convert "$INPUT_ICON" -resize 16x16 temp16.png
convert "$INPUT_ICON" -resize 32x32 temp32.png
convert "$INPUT_ICON" -resize 48x48 temp48.png
convert temp16.png temp32.png temp48.png public/favicon.ico
rm temp16.png temp32.png temp48.png

echo "Ícones PWA gerados com sucesso!"
echo "Não esqueça de substituir o icon-template.svg pelo seu ícone real."
