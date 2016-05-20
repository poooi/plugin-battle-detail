"use strict";

const EventEmitter = require('events');

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

    this.supportFleet = null;
    this.normalSF     = null;
    this.bossSF       = null;

    window.addEventListener('game.response', this.gameResponse.bind(this));
  }

  dispatch(battle) {
    if (!battle) {
      battle = this.battle;
    }
    console.log('dispatch', battle);
    if (battle && battle.time) {
      this.emit('packet', battle.time, battle);
    }
  }

  gameResponse(e) {
    let req = e.detail;
    let {body, postBody} = req;
    let timestamp = Date.now();

    // Support fleet
    // NOTICE: We didn't check support fleet map.
    if (req.path === '/kcsapi/api_port/port') {
      let {normalSF, bossSF} = this;
      this.normalSF = this.bossSF = null;
      for (let deck of body.api_deck_port) {
        let mission = window.$missions[deck.api_mission[1]] || {};
        let missionName = mission.api_name || '';
        if (missionName.includes("前衛支援任務")) {
          this.normalSF = normalSF;
        }
        if (missionName.includes("決戦支援任務")) {
          this.bossSF = bossSF;
        }
      }
    }

    if (req.path === '/kcsapi/api_req_mission/start') {
      let fleetId = postBody.api_deck_id;
      let mission = window.$missions[postBody.api_mission_id] || {};
      let missionName = mission.api_name || '';
      if (missionName.includes("前衛支援任務")) {
        this.normalSF = this.getFleet(fleetId);
      }
      if (missionName.includes("決戦支援任務")) {
        this.bossSF = this.getFleet(fleetId);
      }
      console.log('mission/start', postBody.api_deck_id, postBody.api_mission_id, missionName);
    }


    // Oh fuck. Someone sorties with No.3/4 fleet when having combined fleet.
    if (req.path === '/kcsapi/api_req_map/start') {
      if (this.fleetType != 0 && parseInt(postBody.api_deck_id) != 1) {
        this.fleetType = 0;
      }
    }


    // Reset all
    if (req.path === '/kcsapi/api_port/port') {
      this.battle = null;
      this.fleetType = body.api_combined_flag;
      this.supportFleet = null;
      return;
    }

    // Enter sortie battle
    if (['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'].includes(req.path)) {
      let isBoss = (body.api_event_id === 5);
      let desc;
      if (isBoss)
        desc = [__("Sortie"), "(Boss)"].join(' ');
      else
        desc = __("Sortie");

      this.battle = new Battle({
        map:    [body.api_maparea_id, body.api_mapinfo_no, body.api_no],
        desc:   desc,
        time:   null,  // Assign later
        fleet:  null,  // Assign later
        packet: [],
      });
      this.supportFleet = isBoss ? this.bossSF : this.normalSF;
      return;
    }

    // Process packet in battle
    if (this.battle) {
      // Battle Result
      if (req.path.includes('result')) {
        this.battle = null
      } else {
        // Check for battle packet
        // We assume that all battle packet include `api_deck_id`.
        let fleetId = body.api_deck_id || body.api_dock_id;
        let escortId = this.fleetType != 0 ? 2 : -1;  // HACK: -1 for empty fleet.
        if (!fleetId) {
          return;
        }

        let packet = Object.clone(body);
        packet.poi_path = req.path;
        packet.poi_time = timestamp;

        if (!this.battle.time) {
          this.battle.time = packet.poi_time;
        }
        if (!this.battle.fleet) {
          this.battle.fleet = new Fleet({
            type:    this.fleetType,
            main:    this.getFleet(fleetId),
            escort:  this.getFleet(escortId),
            support: this.supportFleet,
          });
        }
        this.battle.packet.push(packet);
        this.dispatch();
      }
      return;
    }
  }

  // deckId in [1, 2, 3, 4]
  getFleet(deckId) {
    let deck = window._decks[deckId - 1] || {};
    let ships = deck.api_ship;
    if (ships) {
      let fleet = [];
      for (let id of ships) {
        fleet.push(this.getShip(id));
      }
      return fleet;
    } else {
      return null;
    }
  }

  getShip(shipId) {
    let ship = window._ships[shipId] || null;
    if (ship) {
      ship.poi_slot = [];
      for (let id of ship.api_slot) {
        ship.poi_slot.push(this.getItem(id));
      }
      ship.poi_slot_ex = this.getItem(ship.api_slot_ex);
      // Clean up
      delete ship.api_getmes;
      delete ship.api_slot;
      delete ship.api_slot_ex;
      delete ship.api_yomi;
    }
    return ship;
  }

  getItem(itemId) {
    let item = window._slotitems[itemId] || null;
    if (item) {
      // Clean up
      delete item.api_info;
    }
    return item;
  }
}


module.exports = new PacketManager();
