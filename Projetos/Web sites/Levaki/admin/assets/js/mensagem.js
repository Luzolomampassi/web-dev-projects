// const mensagem = document.querySelector("#mensagem");
// const mensagemTexto = mensagem.querySelector(".mensagem-texto");
// const mensagemIcone = mensagem.querySelector(".mensagem-icone");
// const mensagemFechar = mensagem.querySelector(".mensagem-fechar");

// let temporizadorMensagem;

// function mostrarMensagem(texto, tipo = "sucesso", duracao = 4000) {
//     clearTimeout(temporizadorMensagem);

//     const icones = {
//         sucesso: "✓",
//         erro: "!",
//         aviso: "!"
//     };

//     mensagem.classList.remove("sucesso", "erro", "aviso");
//     mensagem.classList.add(tipo);

//     mensagemTexto.textContent = texto;
//     mensagemIcone.textContent = icones[tipo] ?? "!";
//     mensagem.hidden = false;

//     if (duracao > 0) {
//         temporizadorMensagem = setTimeout(() => {
//             fecharMensagem();
//         }, duracao);
//     }
// }

// function fecharMensagem() {
//     clearTimeout(temporizadorMensagem);
//     mensagem.hidden = true;
// }

// mensagemFechar.addEventListener("click", fecharMensagem);