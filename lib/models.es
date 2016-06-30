"use strict"

class Stage {
  constructor(opts) {
    this.type    = opts.type      // StageType
    this.attacks = opts.attacks   // [Attack, ...]

    this.subtype = opts.subtype
    this.kouku   = opts.kouku     // Raw API data `api_kouku`
    this.api     = opts.api       // Engagement: Picked raw data
  }
}

const StageType = {
  // Primary Type
  Aerial:   "Aerial",   // Aerial Combat
  Torpedo:  "Torpedo",  // Torpedo Salvo
  Shelling: "Shelling", // Shelling
  Support:  "Support",  // Support Fleet (Expedition)
  LandBase: "LandBase", // Land Base Aerial Support
  Engagement: "Engagement", // [SP] Engagement Information

  // Sub Type
  Main:   "Main",   // Shelling, main fleet
  Escort: "Escort", // Shelling, escort fleet
  Night:  "Night",  // Shelling, night combat
  Opening: "Opening", // Torpedo, opening torpedo salvo
                      // Shelling, opening anti-sub
}

class Attack {
  constructor(opts) {
    this.type     = opts.type       // AttackType
    this.fromShip = opts.fromShip   // Ship
    this.toShip   = opts.toShip     // Ship

    this.damage = opts.damage   // [int, ...]
    this.hit    = opts.hit      // [HitType, ...]
    this.fromHP = opts.fromHP   // HP before attack.
    this.toHP   = opts.toHP       // HP after attack.
    this.useItem = opts.useItem   // int, $slotitem[] OR null
  }
}

const AttackType = {
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

const HitType = {
  Miss:     0,
  Hit:      1,
  Critical: 2,
}

class Ship {
  constructor(opts) {
    this.id    = opts.id    // int, $ships
    this.owner = opts.owner // ShipOwner
    this.pos   = opts.pos   // int, Position in fleet

    this.maxHP  = opts.maxHP
    this.nowHP  = opts.nowHP
    this.items  = opts.items
    this.initHP = opts.nowHP
    this.lostHP = opts.lostHP || 0
    this.useItem = opts.useItem || null

    this.raw   = opts.raw
  }
}

const ShipOwner = {
  Ours:  "Ours",
  Enemy: "Enemy",
}


class Battle {
  constructor(opts) {
    this.version = "2.0"
    this.map    = opts.map      // [int, int, int] : 2-3-1
    this.desc   = opts.desc     // Description
    this.time   = opts.time     // Seconds since epoch time. Must be same as the first packet.
    this.fleet  = opts.fleet    // [api_port/port.api_ship[], ...] (Extended)
    this.packet = opts.packet   // [Packet, ...] : Order by time
  }
}

class Fleet {
  constructor(opts) {
    this.type     = opts.type      // api_port/port.api_combined_flag
    this.main     = opts.main      // api_get_member/deck[].api_ship (Extended)
    this.escort   = opts.escort    // ^
    this.support  = opts.support   // ^
    this.LBAC     = opts.LBAC      // api_get_member/base_air_corps (Extended)
  }
}


module.exports = {Stage, StageType, Attack, AttackType, HitType, Ship, ShipOwner, Battle, Fleet}
