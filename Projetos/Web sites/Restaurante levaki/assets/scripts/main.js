// ============Scroll========

const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    if (window.scrollY >= 100) {
        header.classList.add('header-fixo');
    } else {
        header.classList.remove('header-fixo');
    }
});
// ============Menu sidebar ==============================
const btn_menu = document.getElementById("btn-menu")
const menu = document.getElementById("menu")
const overlay = document.getElementById("overlay")


// ========= Eventos ===========
btn_menu.addEventListener('click', () =>{
   abrirMenu()
})
overlay.addEventListener('click', () =>{

    fecharMenu()
})
// ========= Funções ===========
function abrirMenu(){
    menu.classList.toggle('drop')
    overlay.classList.toggle('ativo')

    if(menu.classList.contains("drop")){
        btn_menu.innerHTML= '<i class="fa-solid fa-xmark"></i>'
    }
   
    else{
         btn_menu.innerHTML= '<i class="fa fa-bars"></i>'
    }
}
function fecharMenu(){
    menu.classList.remove('drop')
    overlay.classList.remove('ativo')
    btn_menu.innerHTML= '<i class="fa fa-bars"></i>'
   
}







