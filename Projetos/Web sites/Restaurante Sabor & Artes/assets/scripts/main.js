// ============Scroll========

const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    if (window.scrollY >= 100) {
        header.classList.add('header-fixo');
    } else {
        header.classList.remove('header-fixo');
    }
});
// ============menu drop========
const btn_menu = document.getElementById("btn-menu")
const menu = document.getElementById("menu")

btn_menu.addEventListener('click', () =>{
    menu.classList.toggle('drop')

    if(menu.classList.contains("drop")){
        btn_menu.innerHTML= '<i class="fa-solid fa-xmark"></i>'
    }else{
         btn_menu.innerHTML= '<i class="fa fa-bars"></i>'
    }
})
// ============menu drop========

