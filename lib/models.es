"use strict";

class Stage {
  constructor(opts) {
    this.type    = opts.type;     // StageType
    this.attacks = opts.attacks;  // [Attack, ...]

    this.kouku   = opts.kouku;    // Raw API data `api_kouku`
    this.isMain  = opts.isMain;   // Shelling: Is main fleet?
    this.subtype = opts.subtype;  // Support: Suuport type
    this.id      = opts.id;       // LandBase: Corps ID
  }
}

StageType = {
  Aerial:   "Aerial",   // Aerial Combat
  Torpedo:  "Torpedo",  // Torpedo Salve
  Shelling: "Shelling", // Shelling
  Support:  "Support",  // Support Fleet (Expedition)
  LandBase: "LandBase", // Land Base Aerial Support
}

class Attack {
  constructor(opts) {
    this.type     = opts.type;  // AttackType
    this.fromShip = opts.from;  // Ship
    this.toShip   = opts.to;    // Ship

    this.damage = opts.damage;  // [int, ...]
    this.hit    = opts.hit;     // [HitType, ...]
    this.fromHP = opts.fromHP;  // HP before attack.
    this.toHP = opts.toHP;      // HP after attack.
    this.useItem = opts.useItem;  // int, $slotitem[] OR null
  }
}

AttackType = {
  Normal: "Normal",             // 通常攻撃
  Laser:  "Laser",              // レーザー攻撃
  Double: "Double",             // 連撃
  Primary_Secondary_CI: "PSCI", // カットイン(主砲/副砲)
  Primary_Radar_CI:     "PRCI", // カットイン(主砲/電探)
  Primary_AP_CI:        "PACI", // カットイン(主砲/徹甲)
  Primary_Primary_CI:   "PrCI", // カットイン(主砲/主砲)
  Primary_Torpedo_CI:   "PTCI", // カットイン(主砲/魚雷)
  Torpedo_Torpedo_CI:   "TTCI", // カットイン(魚雷/魚雷)
}

HitType = {
  Miss:     0,
  Hit:      1,
  Critical: 2,
}

class Ship {
  constructor(opts) {
    this.id    = opts.id;        // int, $ships
    this.owner = opts.owner;     // ShipOwner
    this.pos   = opts.pos;  // int, Position in fleet

    // Use by simulator2
    this.maxHP = opts.maxHP;
    this.nowHP = opts.nowHP;
    this.items = opts.items;
  }
}

ShipOwner = {
  Ours:  "Ours",
  Enemy: "Enemy",
}


module.exports = {Stage, StageType, Attack, AttackType, HitType, Ship, ShipOwner};
