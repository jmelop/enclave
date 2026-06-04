// Fallback data served by GET /items when the DB is empty or unavailable.
// Fields match inventory_items columns (no status — derived client-side).

interface SeedItem {
  id: string
  name: string
  category: string
  model: string
  qty: number
  location: string
  notes: string
  updated: string
}

export const INITIAL_ITEMS: SeedItem[] = [
  { id:'001', name:'Raspberry Pi 5 8GB',         category:'pc',    model:'RPI5-8GB',        qty:2,  location:'Caja A1 · estante 3',    notes:'Reservada para proyecto home-server. Llegó 03/2025.', updated:'2026-05-12' },
  { id:'002', name:'Arduino Uno Rev3',            category:'mcu',   model:'ARD-UNO-R3',      qty:4,  location:'Cajón 2 · división A',   notes:'2 originales + 2 clones DCcEduino.', updated:'2026-04-28' },
  { id:'003', name:'ESP32-WROOM-32',              category:'mcu',   model:'ESP32-WROOM-32',  qty:7,  location:'Estante B · caja MCU',   notes:'Mix DevKit V1 + NodeMCU-32S.', updated:'2026-05-09' },
  { id:'004', name:'GeForce RTX 4070',            category:'pc',    model:'RTX4070-FE',      qty:1,  location:'Mesa workshop',          notes:'Founders Edition. En uso (rig principal).', updated:'2025-11-04' },
  { id:'005', name:'Resistencia 220Ω 1/4W',       category:'elec',  model:'RES-220R-25',     qty:0,  location:'Bolsita azul · gaveta E', notes:'Reponer — gastadas en tira de LEDs.', updated:'2026-05-14' },
  { id:'006', name:'Resistencia 10kΩ 1/4W',       category:'elec',  model:'RES-10K-25',      qty:85, location:'Bolsita azul · gaveta E', notes:'Pack de 100 menos 15.', updated:'2026-02-18' },
  { id:'007', name:'LED rojo 5mm difuso',         category:'elec',  model:'LED-RED-5MM-D',   qty:32, location:'Caja LED',               notes:'Vf 1.9V, 20mA típico.', updated:'2026-03-30' },
  { id:'008', name:'Soldador TS100',              category:'tools', model:'TS100-B2',        qty:1,  location:'Mesa workshop · gancho', notes:'Firmware IronOS 2.21. Punta B2 instalada.', updated:'2026-01-22' },
  { id:'009', name:'Multímetro Fluke 117',        category:'tools', model:'FLK-117',         qty:1,  location:'Cajón herramientas',     notes:'True-RMS. Calibrado 2025-09.', updated:'2025-09-15' },
  { id:'010', name:'Cables Dupont M-M ×40',       category:'cable', model:'DUP-MM-40',       qty:3,  location:'Caja azul · cables',     notes:'Quedan 3 packs sin abrir.', updated:'2026-05-02' },
  { id:'011', name:'USB-C a USB-C 1m',            category:'cable', model:'USBC-1M-100W',    qty:12, location:'Cajón cables',           notes:'100W PD, datos 480Mb/s.', updated:'2026-04-11' },
  { id:'012', name:'Sensor DHT22 (AM2302)',       category:'elec',  model:'DHT22',           qty:5,  location:'Caja sensores',          notes:'±0.5°C. Pull-up 10k requerido.', updated:'2026-03-08' },
  { id:'013', name:'Servo SG90 9g',               category:'elec',  model:'SG90',            qty:2,  location:'Caja motores',           notes:'Comprar 5 más para proyecto brazo.', updated:'2026-05-10' },
  { id:'014', name:'Osciloscopio Rigol DS1054Z',  category:'tools', model:'DS1054Z',         qty:1,  location:'Mesa workshop · banco',  notes:'Desbloqueado a 100MHz. Sondas ×2.', updated:'2025-12-19' },
  { id:'015', name:'Pantalla OLED 0.96" I2C',     category:'elec',  model:'SSD1306-096',     qty:0,  location:'Caja displays',          notes:'Comprar lote 5x — agotado.', updated:'2026-05-15' },
  { id:'016', name:'Placa base MSI MAG B650',     category:'pc',    model:'MAG-B650-TOMA',   qty:1,  location:'Caja motherboards',      notes:'AM5, sin estrenar. Para build secundario.', updated:'2026-01-08' },
  { id:'017', name:'RAM Corsair Vengeance 32GB',  category:'pc',    model:'CMK32GX5M2B6000', qty:2,  location:'Caja RAM',               notes:'DDR5-6000 CL30. Kits 2×16GB.', updated:'2026-02-02' },
  { id:'018', name:'Shield Ethernet W5100',       category:'mcu',   model:'W5100-SHIELD',    qty:2,  location:'Caja shields',           notes:'Compatible Arduino Uno/Mega.', updated:'2025-08-21' },
  { id:'019', name:'Pinzas ESD curvas',           category:'tools', model:'ESD-15-SA',       qty:3,  location:'Mesa workshop · imán',   notes:'Set 6 piezas, faltan 3.', updated:'2025-10-30' },
  { id:'020', name:'Termoretractil surtido',      category:'cable', model:'HSK-280PCS',      qty:1,  location:'Cajón cables',           notes:'Pack casi vacío.', updated:'2026-05-13' },
  { id:'021', name:'Caja organizadora SKB',       category:'other', model:'SKB-iSeries-1209',qty:2,  location:'Bajo mesa',              notes:'Resistente al agua. Para llevar a hackathons.', updated:'2025-07-12' },
  { id:'022', name:'Transistor 2N2222 NPN',       category:'elec',  model:'2N2222A-TO92',    qty:18, location:'Bolsita amarilla',       notes:'Switching general purpose.', updated:'2026-02-25' },
]
