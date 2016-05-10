"use strict";

const EventEmitter = require('events');

const NORMAL_SUPPORT_EXPEDITION = [33, 181];
const BOSS_SUPPORT_EXPEDITION   = [34, 182];


class Battle {
  constructor(opts) {
    this.version = "2.0";
    this.map    = opts.map;     // [int, int, int] : 2-3-1
    this.desc   = opts.desc;    // Description
    this.time   = opts.time;    // Seconds since epoch time. Must be same as the first packet.
    this.fleet  = opts.fleet;   // [api_port/port.api_ship[], ...] (Extended)
    this.packet = opts.packet;  // [Packet, ...] : Order by time
  }
}

class Fleet {
  constructor(opts) {
    this.type     = opts.type;     // api_port/port.api_combined_flag
    this.main     = opts.main;     // api_get_member/deck[].api_ship (Extended)
    this.escort   = opts.escort;   // ^
    this.support  = opts.support;  // ^
  }
}

class PacketManager extends EventEmitter {
  constructor() {
    super();

    this.battle    = null;
    this.fleetType = null;

    this.supportFleet       = null;
    this.normalSupportFleet = null;
    this.bossSupportFleet   = null;

    window.addEventListener('game.response', this.gameResponse.bind(this));
  }

  dispatch() {
    console.log('dispatch', this.battle);
    if (this.battle && this.battle.time) {
      this.emit('packet', this.battle.time, this.battle);
    }
  }

  gameResponse(e) {
    let req = e.detail;
    let {body, postBody} = req;

    // Oh fuck. Someone sorties with No.3/4 fleet when having combined fleet.
    if (req.path === '/kcsapi/api_req_map/start') {
      if (this.fleetType != 0 && parseInt(postBody.api_deck_id) != 1) {
        this.fleetType = 0;
      }
    }

    // Support fleet
    // NOTICE: We didn't check support fleet map.
    if (req.path === '/kcsapi/api_port/port') {
      let normal = false, boss = false;
      for (let deck of body.api_deck_port) {
        normal = normal || NORMAL_SUPPORT_EXPEDITION.includes(deck.api_mission[1]);
        boss = boss || BOSS_SUPPORT_EXPEDITION.includes(deck.api_mission[1]);
      }
      this.supportFleet = null;
      this.normalSupportFleet = normal ? null : this.normalSupportFleet;
      this.bossSupportFleet = boss ? null : this.bossSupportFleet;
    }
    if (req.path === 'api_req_mission/start') {
      if (NORMAL_SUPPORT_EXPEDITION.includes(postBody.api_mission_id)) {
        this.normalSupportFleet = this.getFleet(postBody.api_deck_id);
      }
      if (BOSS_SUPPORT_EXPEDITION.includes(postBody.api_mission_id)) {
        this.bossSupportFleet = this.getFleet(postBody.api_deck_id);
      }
    }
    if (['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'].includes(req.path)) {
      let isBoss = (body.api_event_id === 5);
      this.supportFleet = isBoss ? this.bossSupportFleet : this.normalSupportFleet;
    }

    // Battle
    if (req.path === '/kcsapi/api_port/port') {
      this.fleetType = body.api_combined_flag;
      this.battle = null;
      return;
    }
    if (['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'].includes(req.path)) {
      let isBoss = (body.api_event_id === 5);
      let desc = [__("Sortie")];
      if (isBoss) desc.push("Boss");
      this.battle = new Battle({
        map: [body.api_maparea_id, body.api_mapinfo_no, body.api_no],
        desc: desc.join(' '),
        packet: [],
      });
      return;
    }
    if (this.battle && req.path.includes('result')) {
      this.battle = null;
      return;
    }
    if (this.battle) {
      if (!this.battle.fleet) {
        if (this.fleetType === 0) {
          let deckId = body.api_deck_id || body.api_dock_id;
          this.battle.fleet = new Fleet({
            type:    this.fleetType,
            main:    this.getFleet(deckId),
            escort:  null,
            support: this.supportFleet,
          });
        } else {
          this.battle.fleet = new Fleet({
            type:    this.fleetType,
            main:    this.getFleet(1),
            escort:  this.getFleet(2),
            support: this.supportFleet,
          });
        }
      }
      let packet = Object.clone(body);
      packet.poi_path = req.path;
      packet.poi_time = Date.now();
      this.battle.packet.push(packet);
      if (!this.battle.time) {
        this.battle.time = packet.poi_time;
      }
      this.dispatch();
      return;
    }
  }

  // deckId in [1, 2, 3, 4]
  getFleet(deckId) {
    let fleet = [];
    let deck = window._decks[deckId - 1].api_ship || [];
    for (let id of deck) {
      fleet.push(this.getShip(id));
    }
    return fleet;
  }

  getShip(shipId) {
    let ship = window._ships[shipId] || null;
    if (ship) {
      ship.poi_slot_ex = this.getItem(ship.api_slot_ex);
      ship.poi_slot = [];
      for (let id of ship.api_slot) {
        ship.poi_slot.push(this.getItem(id));
      }
      // Clean up
      delete ship.api_getmes
    }
    return ship;
  }

  getItem(itemId) {
    let item = window._slotitems[itemId] || null;
    if (item) {
      // Clean up
      delete item.api_info
    }
    return item;
  }
}


module.exports = new PacketManager();
