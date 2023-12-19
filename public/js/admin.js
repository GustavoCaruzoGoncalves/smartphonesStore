function exibirPreviewImagem() {
    const inputImagem = document.getElementById('imagem');
    const previewImagem = document.getElementById('imagemPreview');

    inputImagem.addEventListener('change', function () {
        const arquivo = inputImagem.files[0];

        if (arquivo) {
            const leitor = new FileReader();

            leitor.onload = function (e) {
                previewImagem.src = e.target.result;
                previewImagem.style.display = 'block';
            };

            leitor.readAsDataURL(arquivo);
        } else {
            previewImagem.src = '#';
            previewImagem.style.display = 'none';
        }
    });
}

// Chama a função quando a página carregar
window.onload = exibirPreviewImagem;