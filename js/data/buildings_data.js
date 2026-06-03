// Isla del Diablo — data/buildings_data.js
// Tropico 2 canonical building reference in English.
// Internal IDs remain defined in core/state.js for compatibility with saves, rendering and systems.

const TROPICO2_BUILDING_REFERENCE_EN = {
  infrastructure:[
    'Black Market','Captive Dormitory','Mess Tent','Construction Tent',
    'Pirate Cave','Pirate House','Pirate Palace','Path','Smuggler\'s Cove'
  ],
  resources:[
    'Banana Plantation','Corn Farm','Iron Mine','Papaya Plantation',
    'Sugarcane Plantation','Lumber Camp','Tobacco Plantation'
  ],
  production:[
    'Bakery','Blacksmith','Foundry','Brewery','Cannon Foundry',
    'Cigar Factory','Armory','Rum Distillery','Sawmill'
  ],
  entertainment:[
    'Animal Pit','Brothel & Saloon','Casino','Cheap Eats',
    'Courtesans & Baths','Gambling Hall','Inn','Smuggler\'s Dive',
    'Tavern','Masseuses & Maids'
  ],
  nautical:['Boat Yard','Dock','Sea Rations Factory','Shipyard'],
  captiveControl:[
    'Apothecary','Church','Gallows','Special Captives Hotel',
    'Interrogation Chamber','Prisoner Cage'
  ],
  training:[
    'Gunnery School','Shooting School','Navigation School',
    'Seamanship School','Fencing School'
  ],
  defense:['Fort','Lookout','Coastal Cannon','Guard Tower'],
  accessories:['Carpenter','Cemetery','Hat Shop','Parrot Aviary']
};

// Build menu policy:
// - show only Tropico 2-canonical buildings or Isla del Diablo essentials;
// - keep legacy IDs in ED but hide non-canonical/unsupported entries with buildable:false.
const TROPICO2_CANONICAL_BUILDING_NAMES = new Set(
  Object.values(TROPICO2_BUILDING_REFERENCE_EN).flat()
);
