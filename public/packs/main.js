import cards from './store.js';
import { getSId, clamp } from './utils.js';

const carousel = document.getElementById('carousel');
const cardsContainer = document.getElementById('cards-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let focusedIndex = 0;
let packs = [];

function processData() {
  const packsMap = new Map();
  for (const key in cards) {
    const card = cards[key];
    const packName = key.split(' - ')[0];
    if (!packsMap.has(packName)) {
      packsMap.set(packName, []);
    }
    packsMap.get(packName).push(card);
  }
  packs = Array.from(packsMap.entries()).map(([name, cards]) => ({ name, cards }));
}

function renderCarousel() {
  carousel.innerHTML = '';
  packs.forEach((pack, index) => {
    const item = document.createElement('div');
    item.className = `carousel-item ${index === focusedIndex ? 'focused' : ''}`;
    item.dataset.index = index;
    const img = document.createElement('img');
    const baseImageName = pack.name.replace(/ /g, '-');
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    let currentExtensionIndex = 0;

    function tryLoadImage() {
      if (currentExtensionIndex < extensions.length) {
        img.src = `./assets/cardpacks/${baseImageName}.${extensions[currentExtensionIndex]}`;
        currentExtensionIndex++;
      } else {
        // Optional: set a default image if none of the extensions work
        // img.src = './assets/cardpacks/default.jpg';
      }
    }

    img.onerror = tryLoadImage;
    tryLoadImage();

    item.appendChild(img);
    item.addEventListener('click', () => {
      focusedIndex = index;
      render();
    });
    carousel.appendChild(item);
  });
  updateCarouselTransform();
}

function updateCarouselTransform() {
  const focusedItem = carousel.children[focusedIndex];
  if (focusedItem) {
    const carouselWidth = carousel.offsetWidth;
    const focusedItemWidth = focusedItem.offsetWidth;
    const focusedItemOffsetLeft = focusedItem.offsetLeft;
    const scrollLeft = focusedItemOffsetLeft - (carouselWidth / 2) + (focusedItemWidth / 2);
    carousel.style.transform = `translateX(-${scrollLeft}px)`;
  }
}

function renderCards() {
  cardsContainer.innerHTML = '';
  if (packs.length === 0) return;

  const pack = packs[focusedIndex];
  pack.cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    let content = `<h3>${card.name}</h3>`;
    if (card.types.includes('upgrade')) {
      content += `<p><strong>Type:</strong> ${card.types}</p>`;
      if (card.classes) {
        content += `<p><strong>Classes:</strong> ${card.classes}</p>`;
      }
    } else if (card.types.includes('character')) {
        content += `<p><strong>Type:</strong> ${card.factions}</p>`;
        if (card.classes) {
            content += `<p><strong>Classes:</strong> ${card.classes}</p>`;
        }
    }
    content += `<p>${card.base}</p>`;
    cardEl.innerHTML = content;
    cardsContainer.appendChild(cardEl);
  });
}

function render() {
  renderCarousel();
  renderCards();
}

prevBtn.addEventListener('click', () => {
  focusedIndex = Math.max(0, focusedIndex - 1);
  render();
});

nextBtn.addEventListener('click', () => {
  focusedIndex = Math.min(packs.length - 1, focusedIndex + 1);
  render();
});

window.addEventListener('resize', updateCarouselTransform);

processData();
render();
