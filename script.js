const pages = [...document.querySelectorAll('.page')];
const navigation = document.querySelector('.navigation');
const previousButton = document.querySelector('#previous-page');
const nextButton = document.querySelector('#next-page');
const sealButton = document.querySelector('#open-envelope');
const pageStatus = document.querySelector('#page-status');
const responsePanel = document.querySelector('#response-panel');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentPage = 0;
let opening = false;
let responseIndex = 0;
let gesture = null;

const responses = [
  { title: 'SE VOCÊ FOR,', text: 'parabéns amigo(a)/tio(a)/primo(a), você é demais, me chama aqui para comprar o seu ingresso.' },
  { title: 'SE VOCÊ NÃO FOR,', text: 'eu entendo, sem guardar rancor, mas não venha tirar dúvidas jurídicas comigo depois.' },
];

function showPage(index) {
  if (index < 0 || index >= pages.length || index === currentPage || opening) return;
  const direction = index > currentPage ? 'enter-next' : 'enter-previous';
  pages[currentPage].classList.remove('active', 'enter-next', 'enter-previous');
  pages[currentPage].inert = true;
  pages[currentPage].removeAttribute('aria-current');
  currentPage = index;
  pages[currentPage].classList.add('active', direction);
  pages[currentPage].inert = false;
  pages[currentPage].setAttribute('aria-current', 'page');
  navigation.hidden = currentPage === 0;
  nextButton.disabled = currentPage === pages.length - 1;
  document.querySelectorAll('.page-dots span').forEach((dot, dotIndex) => {
    dot.classList.toggle('selected', dotIndex === currentPage);
  });
  pageStatus.textContent = `Página ${currentPage + 1} de ${pages.length}: ${pages[currentPage].getAttribute('aria-label')}`;
  if (currentPage === 0) {
    pages[0].classList.remove('opening');
    sealButton.disabled = false;
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (document.activeElement?.closest('[inert]') || document.activeElement?.disabled || document.activeElement?.closest('[hidden]')) {
    (currentPage === 0 ? sealButton : previousButton).focus({ preventScroll: true });
  }
}

sealButton.addEventListener('click', () => {
  if (opening) return;
  opening = true;
  sealButton.disabled = true;
  pages[0].classList.add('opening');
  window.setTimeout(() => {
    opening = false;
    showPage(1);
  }, reducedMotion.matches ? 0 : 1150);
});

previousButton.addEventListener('click', () => showPage(currentPage - 1));
nextButton.addEventListener('click', () => showPage(currentPage + 1));

function updateResponse() {
  const response = responses[responseIndex];
  document.querySelector('#response-title').textContent = response.title;
  document.querySelector('#response-text').textContent = response.text;
  responsePanel.classList.toggle('is-yes', responseIndex === 0);
  responsePanel.classList.toggle('is-no', responseIndex === 1);
  responsePanel.querySelectorAll('.response-dots span').forEach((dot, index) => {
    dot.classList.toggle('selected', index === responseIndex);
  });
  const particles = document.createDocumentFragment();
  for (let index = 0; index < 14; index += 1) {
    const particle = document.createElement('span');
    particle.className = responseIndex === 0 ? 'spark' : 'rain';
    particle.style.left = `${(index * 37 + 3) % 100}%`;
    particle.style.animationDelay = `${-index * .23}s`;
    if (responseIndex === 0) {
      particle.textContent = '✦';
      particle.style.top = `${(index * 29 + 4) % 94}%`;
      particle.style.fontSize = `${8 + (index % 3) * 4}px`;
    }
    particles.append(particle);
  }
  responsePanel.querySelector('.weather').replaceChildren(particles);
}

document.querySelectorAll('[data-response]').forEach(button => {
  button.addEventListener('click', () => {
    responseIndex = (responseIndex + 1) % responses.length;
    updateResponse();
  });
});

const pageSurface = document.querySelector('#pages');
pageSurface.addEventListener('pointerdown', event => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button')) return;
  gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, inResponse: Boolean(event.target.closest('.response-panel')) };
  pageSurface.setPointerCapture(event.pointerId);
});

pageSurface.addEventListener('pointerup', event => {
  if (!gesture || gesture.id !== event.pointerId) return;
  const distanceX = event.clientX - gesture.x;
  const distanceY = event.clientY - gesture.y;
  const inResponse = gesture.inResponse;
  gesture = null;
  if (Math.abs(distanceX) < 45 || Math.abs(distanceX) < Math.abs(distanceY) * 1.3) return;
  if (inResponse) {
    responseIndex = (responseIndex + 1) % responses.length;
    updateResponse();
  } else if (currentPage > 0) {
    showPage(currentPage + (distanceX < 0 ? 1 : -1));
  }
});

pageSurface.addEventListener('pointercancel', () => { gesture = null; });
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || opening) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (event.target.closest('.response-panel')) {
    event.preventDefault();
    responseIndex = (responseIndex + 1) % responses.length;
    updateResponse();
  } else if (currentPage > 0) {
    event.preventDefault();
    showPage(currentPage + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

updateResponse();
window.lucide?.createIcons();