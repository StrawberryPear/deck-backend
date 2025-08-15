import cards from './store.js';
import { getSId, clamp } from './utils.js';

const carouselEle = document.getElementById('carousel');
const cardsContainer = document.getElementById('cards-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let focusedIndex = 0;
const basePacks = [
  {
    "name": "Adventure Gear",
    "image": "./assets/cardpacks/Adventure-Gear.jpg",
    "shop": "https://www.relicblade.com/shop/p/gear-cards",
    "shopPdf": "https://www.relicblade.com/shop/p/adventure-gear-cards-pdf"
  },
  {
    "name": "Apostles of the Deep",
    "image": "./assets/cardpacks/Apostles-of-the-Deep.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/apostles-of-the-deep-cards-pdf"
  },
  {
    "name": "Battle Pigs",
    "image": "./assets/cardpacks/Battle-Pigs.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/battle-pig-cards-pdf"
  },
  {
    "name": "Bone and Darkness AI",
    "image": "./assets/cardpacks/Bone-and-Darkness.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/bone-and-darkness-cards-pdf"
  },
  {
    "name": "Kingdoms of Akadh",
    "image": "./assets/cardpacks/Kingdoms-of-Akadh.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/kingdoms-of-akadh-cards-pdf"
  },
  {
    "name": "Lostwood Enclave",
    "image": "./assets/cardpacks/Lostwood-Enclave.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/lostwood-enclave-cards-pdf"
  },
  {
    "name": "Moldorf Expedition",
    "image": "./assets/cardpacks/Moldorf-Expedition.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/moldorf-expedition-cards-pdf"
  },
  {
    "name": "Singular Champions 1",
    "image": "./assets/cardpacks/Singular-Champions-1.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/singular-champions-1-cards-pdf"
  },
  {
    "name": "Singular Champions 2",
    "image": "./assets/cardpacks/Singular-Champions-2.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/singular-champions-2-cards-pdf"
  },
  {
    "name": "Storms of Kural cards",
    "image": "./assets/cardpacks/Storms-of-Kural.jpg",
    "shop": "https://www.relicblade.com/shop/p/storms-of-kural",
    "shopPdf": "https://www.relicblade.com/shop/p/storms-of-kural-digital-download"
  },
  {
    "name": "Temple of Justice",
    "image": "./assets/cardpacks/Temple-of-Justice.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/temple-of-justice-cards-pdf"
  },
  {
    "name": "The Lone Guard 19",
    "image": "./assets/cardpacks/Lone-Guard.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/lone-guard-cards-pdf"
  },
  {
    "name": "Wretched Hive",
    "image": "./assets/cardpacks/Wretched-Hive.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/wretched-hive-cards-pdf"
  },
  {
    "name": "The Wilderkin",
    "image": "./assets/cardpacks/Wilderkin.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/wilderkin-cards-pdf"
  },
  {
    "name": "Relics of the Volge",
    "image": "./assets/cardpacks/Relics-of-the-Volge.jpg",
    "shop": "https://www.relicblade.com/shop/p/relic-cards",
    "shopPdf": "https://www.relicblade.com/shop/p/relics-of-the-volge-10-card-expansion-digital-download"
  },
  {
    "name": "Singular Champions 3",
    "image": "./assets/cardpacks/Singular-Champions-3.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/singular-champions-3-cards-pdf"
  },
  {
    "name": "Singular Champions 4",
    "image": "./assets/cardpacks/Singular-Champions-4.jpg",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/singular-champions-4-cards-pdf"
  },
  {
    "name": "Aug Suul",
    "image": "./assets/cardpacks/Aug-Suul.webp",
    "shop": "https://www.relicblade.com/shop/p/factionbooster",
    "shopPdf": "https://www.relicblade.com/shop/p/the-aug-suul-digital-download"
  },
  {
    "name": "Unknown",
    "ignore": true
  },
  {
    "name": "Monsters Color",
    "image": "./assets/cardpacks/Wild-Monsters.jpg",
    "shop": "https://www.relicblade.com/shop/p/monster-cards",
    "shopPdf": "https://www.relicblade.com/shop/p/wild-monster-cards-pdf"
  },
  {
    "name": "Legends 1",
    "image": "./assets/cardpacks/Legends-1.jpg",
    "ignore": true
  },
  {
    "name": "Legends 2",
    "image": "./assets/cardpacks/Legends-2.jpg",
    "ignore": true
  },
  {
    "name": "Legends 3",
    "image": "./assets/cardpacks/Legends-3.jpg",
    "ignore": true
  },
  {
    "name": "Legends 4",
    "image": "./assets/cardpacks/Legends-4.jpg",
    "ignore": true
  },
  {
    "name": "Seeker's Campaign Cards",
    "image": "./assets/cardpacks/Seeker-Campaign-Cards.jpg",
    "shop": "https://www.relicblade.com/shop/p/seeker-cards",
    "shopPdf": "https://www.relicblade.com/shop/p/seekers-handbook-campaign-cards-10-card-expansion-digital-download"
  },
  {
    "name": "Guild Champions Cards",
    "image": "./assets/cardpacks/Guild-Champions.webp",
    "shop": "https://www.relicblade.com/shop/p/guildchampions-faction",
    "shopPdf": "https://www.relicblade.com/shop/p/guild-champions-faction-pdf"
  },
  {
    "name": "Severed Hand Cards",
    "image": "./assets/cardpacks/Severed-Hand.webp",
    "shop": "https://www.relicblade.com/shop/p/severed-hand-faction",
    "shopPdf": "https://www.relicblade.com/shop/p/severed-hand-faction-pdf"
  },
  {
    "name": "Paragons Vol 1",
    "image": "./assets/cardpacks/Paragons-1.webp",
    "shopPdf": "https://www.relicblade.com/shop/p/paragonsvol1pdf"
  }
];
let packs = [];
let flkty;

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
  packs = Array.from(packsMap.entries())
    .map(([name, cards]) => ({ name, cards }))
    .map(cardPack => ({...basePacks.find(baseCardPack => baseCardPack.name == cardPack.name), ...cardPack}))
    .filter(pack => !pack.ignore)
    .sort((a, b) => a.name - b.name)
}

function renderCarousel() {
  carouselEle.innerHTML = '';
  packs.forEach((pack, index) => {
    const cardPackEle = document.createElement('div');

    cardPackEle.className = `carousel-item`;
    const cardPackImage = document.createElement('img');

    cardPackEle.addEventListener("click", () => {
      flkty.select(index); // scrolls to this cell
    })
    cardPackImage.src = pack.image

    cardPackEle.appendChild(cardPackImage);
    carouselEle.appendChild(cardPackEle);
  });

  flkty = new Flickity(carouselEle, {
  pageDots: false,
  cellAlign: 'center',
  cellSelector: '.carousel-item'
  });

  flkty.on('select', renderCards);
}

function renderCards() {
  const pack = packs[flkty.selectedIndex];

  cardsContainer.innerHTML = `<h2>${pack.name} ${pack.shopPdf ? `<a href=${pack.shopPdf}>Buy Digital</a>` : ``} ${pack.shop ? `<a href=${pack.shop}>Buy Physical</a>` : ``} </h2>`;

  if (packs.length === 0) return;

  pack.cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    let content = `<h3>${card.name}</h3>`;
    if (card.types.includes('upgrade')) {
      content += `<p><strong>Type:</strong> <stat>${card.types.replace(/upgrade/g, '').trim()}</stat></p>`;
      if (card.classes) {
        content += `<p><strong>Keywords:</strong> <stat>${card.classes}</stat></p>`;
      }
    } else if (card.types.includes('character')) {
        content += `<p><strong>Allegiance:</strong> <stat>${card.factions}</stat></p>`;
        if (card.classes) {
            content += `<p><strong>Keywords:</strong> <stat>${card.classes}</stat></p>`;
        }
    }
    content += `<p class="description">${card.description}</p>`;
    cardEl.innerHTML = content;
    cardsContainer.appendChild(cardEl);
  });
}

function render() {
  renderCarousel();
  renderCards();
}

processData();
render();
