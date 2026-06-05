import type { Category, InventoryItem } from '@/types/inventory'
// TODO: history out of scope — see future branch feat/inventory-history
// import type { HistoryEntry } from '@/types/inventory'

export const CATEGORIES: Category[] = [
  { id: 'pc',    label: 'PC Components',    short: 'PC',    hue: 220 },
  { id: 'mcu',   label: 'Microcontrollers', short: 'MCU',   hue: 160 },
  { id: 'elec',  label: 'Electronics',      short: 'ELEC',  hue: 80  },
  { id: 'tools', label: 'Tools',            short: 'TOOLS', hue: 300 },
  { id: 'cable', label: 'Cables & Conn.',   short: 'CABLE', hue: 350 },
  { id: 'other', label: 'Other',            short: 'OTHER', hue: 260 },
]

export const SEED_ITEMS: InventoryItem[] = [
  { id:'001', name:'Raspberry Pi 5 8GB',         category:'pc',    model:'RPI5-8GB',        qty:2,  status:'in',  location:'Box A1 · shelf 3',         notes:'Reserved for home-server project. Arrived 03/2025.', updated:'2026-05-12' },
  { id:'002', name:'Arduino Uno Rev3',            category:'mcu',   model:'ARD-UNO-R3',      qty:4,  status:'in',  location:'Drawer 2 · section A',     notes:'2 originals + 2 DCcEduino clones.', updated:'2026-04-28' },
  { id:'003', name:'ESP32-WROOM-32',              category:'mcu',   model:'ESP32-WROOM-32',  qty:7,  status:'in',  location:'Shelf B · MCU box',         notes:'Mix DevKit V1 + NodeMCU-32S.', updated:'2026-05-09' },
  { id:'004', name:'GeForce RTX 4070',            category:'pc',    model:'RTX4070-FE',      qty:1,  status:'in',  location:'Workshop table',           notes:'Founders Edition. In use (main rig).', updated:'2025-11-04' },
  { id:'005', name:'Resistor 220Ω 1/4W',          category:'elec',  model:'RES-220R-25',     qty:0,  status:'out', location:'Blue bag · drawer E',      notes:'Restock — used up in LED strip.', updated:'2026-05-14' },
  { id:'006', name:'Resistor 10kΩ 1/4W',          category:'elec',  model:'RES-10K-25',      qty:85, status:'in',  location:'Blue bag · drawer E',      notes:'Pack of 100 minus 15.', updated:'2026-02-18' },
  { id:'007', name:'Red LED 5mm diffuse',         category:'elec',  model:'LED-RED-5MM-D',   qty:32, status:'in',  location:'LED box',                  notes:'Vf 1.9V, 20mA typical.', updated:'2026-03-30' },
  { id:'008', name:'Soldering Iron TS100',        category:'tools', model:'TS100-B2',        qty:1,  status:'in',  location:'Workshop table · hook',    notes:'Firmware IronOS 2.21. B2 tip installed.', updated:'2026-01-22' },
  { id:'009', name:'Multimeter Fluke 117',        category:'tools', model:'FLK-117',         qty:1,  status:'in',  location:'Tools drawer',             notes:'True-RMS. Calibrated 2025-09.', updated:'2025-09-15' },
  { id:'010', name:'Dupont Cables M-M ×40',       category:'cable', model:'DUP-MM-40',       qty:3,  status:'low', location:'Blue box · cables',        notes:'3 unopened packs remaining.', updated:'2026-05-02' },
  { id:'011', name:'USB-C to USB-C 1m',           category:'cable', model:'USBC-1M-100W',    qty:12, status:'in',  location:'Cables drawer',            notes:'100W PD, 480Mb/s data.', updated:'2026-04-11' },
  { id:'012', name:'DHT22 Sensor (AM2302)',        category:'elec',  model:'DHT22',           qty:5,  status:'in',  location:'Sensors box',              notes:'±0.5°C. 10k pull-up required.', updated:'2026-03-08' },
  { id:'013', name:'Servo SG90 9g',               category:'elec',  model:'SG90',            qty:2,  status:'low', location:'Motors box',               notes:'Buy 5 more for arm project.', updated:'2026-05-10' },
  { id:'014', name:'Oscilloscope Rigol DS1054Z',  category:'tools', model:'DS1054Z',         qty:1,  status:'in',  location:'Workshop table · bench',   notes:'Unlocked to 100MHz. ×2 probes.', updated:'2025-12-19' },
  { id:'015', name:'OLED Display 0.96" I2C',      category:'elec',  model:'SSD1306-096',     qty:0,  status:'out', location:'Displays box',             notes:'Buy 5x lot — out of stock.', updated:'2026-05-15' },
  { id:'016', name:'MSI MAG B650 Motherboard',    category:'pc',    model:'MAG-B650-TOMA',   qty:1,  status:'in',  location:'Motherboards box',         notes:'AM5, brand new. For secondary build.', updated:'2026-01-08' },
  { id:'017', name:'Corsair Vengeance RAM 32GB',  category:'pc',    model:'CMK32GX5M2B6000', qty:2,  status:'in',  location:'RAM box',                  notes:'DDR5-6000 CL30. 2×16GB kits.', updated:'2026-02-02' },
  { id:'018', name:'W5100 Ethernet Shield',       category:'mcu',   model:'W5100-SHIELD',    qty:2,  status:'in',  location:'Shields box',              notes:'Compatible with Arduino Uno/Mega.', updated:'2025-08-21' },
  { id:'019', name:'Curved ESD Tweezers',         category:'tools', model:'ESD-15-SA',       qty:3,  status:'in',  location:'Workshop table · magnet',  notes:'Set of 6 pieces, 3 missing.', updated:'2025-10-30' },
  { id:'020', name:'Heat Shrink Assortment',      category:'cable', model:'HSK-280PCS',      qty:1,  status:'low', location:'Cables drawer',            notes:'Pack almost empty.', updated:'2026-05-13' },
  { id:'021', name:'SKB Organizer Case',          category:'other', model:'SKB-iSeries-1209',qty:2,  status:'in',  location:'Under table',              notes:'Water-resistant. For taking to hackathons.', updated:'2025-07-12' },
  { id:'022', name:'Transistor 2N2222 NPN',       category:'elec',  model:'2N2222A-TO92',    qty:18, status:'in',  location:'Yellow bag',               notes:'General purpose switching.', updated:'2026-02-25' },
]

// TODO: history out of scope — see future branch feat/inventory-history
// export const SEED_HISTORY: Record<string, HistoryEntry[]> = {
//   '001': [{ d:'2025-03-04', q:1, why:'received' }, { d:'2025-08-12', q:2, why:'+1 build' }],
//   '002': [{ d:'2023-11-10', q:6, why:'received' }, { d:'2024-06-04', q:5, why:'-1 gift' },     { d:'2025-02-19', q:4, why:'-1 broken' }],
//   '005': [{ d:'2024-09-01', q:100,why:'received' },{ d:'2026-01-14', q:42, why:'-58 project' },{ d:'2026-05-14', q:0, why:'-42 LED strip' }],
//   '010': [{ d:'2025-05-22', q:8, why:'received' }, { d:'2026-02-10', q:5, why:'-3 used' },     { d:'2026-05-02', q:3, why:'-2 used' }],
//   '013': [{ d:'2025-01-08', q:5, why:'received' }, { d:'2025-10-30', q:3, why:'-2 robot arm' },{ d:'2026-05-10', q:2, why:'-1 test' }],
//   '015': [{ d:'2024-12-15', q:3, why:'received' }, { d:'2025-06-20', q:2, why:'-1 broken' },   { d:'2026-05-15', q:0, why:'-2 dashboard' }],
// }
