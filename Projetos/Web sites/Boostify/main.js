const menuButton = document.querySelector('#btn-menu');
const menu = document.querySelector('#menu');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
  menu.classList.toggle('open', !isOpen);
});

menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
}));

const quotes = [
  {
    text: 'A Boostify deu à nossa equipa uma visão que antes demorávamos dias a construir. Agora, sabemos onde focar.',
    name: 'Mariana Souza',
    role: 'Directora, NextTech',
    initial: 'M'
  },
  {
    text: 'Finalmente temos os nossos números num só lugar. A equipa ganhou tempo e as decisões ficaram muito mais fáceis.',
    name: 'Lucas Fernandes',
    role: 'CEO, Mídias Digital',
    initial: 'L'
  },
  {
    text: 'Os relatórios são claros e ajudam-nos a agir mais cedo. Tornou-se uma ferramenta essencial para o nosso crescimento.',
    name: 'Beatriz Lima',
    role: 'Gestora, InovaCorp',
    initial: 'B'
  }
];
let quoteIndex = 0;

function showQuote(index) {
  quoteIndex = (index + quotes.length) % quotes.length;
  const quote = quotes[quoteIndex];
  document.querySelector('#quote-text').textContent = quote.text;
  document.querySelector('#quote-name').textContent = quote.name;
  document.querySelector('#quote-role').textContent = quote.role;
  document.querySelector('#quote-avatar').textContent = quote.initial;
  document.querySelector('#quote-current').textContent = `0${quoteIndex + 1}`;
}

document.querySelector('#prev-quote').addEventListener('click', () => showQuote(quoteIndex - 1));
document.querySelector('#next-quote').addEventListener('click', () => showQuote(quoteIndex + 1));
