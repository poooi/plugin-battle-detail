"use strict";

class Battle {
  constructor(opts) {
    this.version = "2.0";

    this.description = opts.description;
    this.map        = opts.map;       // [int, int, int] : 2-3-1
    this.timestamp  = opts.timestamp; // Seconds since epoch time. Should be same as the first packet.
    this.fleet  = opts.fleet;   // Fleet
    this.packet = opts.packet;  // [Packet, ...] : Order by time
  }
}

class Fleet {
  constructor(opts) {
    this.type     = opts.type;     // FleetType
    this.main     = opts.main;     // [Ship, ...] (Allow null)
    this.escort   = opts.escort;   // ^
    this.support  = opts.support;  // ^
  }
}

FleetType = {
  Normal    : 0,
  Carrier   : 1,  // 空母機動部隊
  Surface   : 2,  // 水上打撃部隊
  Transport : 3,  // 輸送護衛部隊
}

class Ship {
  constructor(opts) {
    this.id = opts.id;  // api_mst_ship[].api_id

    this.level     = opts.level;
    this.firepower = opts.firepower;  // Exclude equipment properties.
    this.torpedo   = opts.torpedo;    // ^
    this.antiair   = opts.antiair;    // ^
    this.armor     = opts.armor;      // ^
    this.luck      = opts.luck;

    this.hp_max = opts.hp_max;  // Maximum HP
    this.hp     = opts.hp;      // Current HP
    this.fuel   = opts.fuel;    // ^
    this.ammo   = opts.ammo;    // ^
    this.morale = opts.morale;  // ^

    this.items   = opts.items;    // [ShipItem, ...] (Allow null)
    this.item_ex = opts.item_ex;  // ShipItem (Allow null)
  }
}

class ShipItem {}
  constructor(opts) {
    this.id    = opts.id;     // api_mst_slotitem[].api_id
    this.level = opts.level;  // Improvement level (0)
    this.skill = opts.skill;  // Aircraft skill level (0)
    this.count = opts.count;  // api_port.api_ship[].api_onslot[i] (0)
  }
}

class Packet {
  constructor (opts) {
    this.path = opts.path;  // API path
    this.data = opts.data;  // API response (JSON Object)
    this.timestamp = opts.timestamp;  // Seconds since epoch time.
  }
}


module.exports = {
  Battle,
  Fleet, FleetType,
  Ship, ShipItem,
  Packet,
}