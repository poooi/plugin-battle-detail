"use strict";

{Stage, StageType, Attack, AttackType, HitType, Ship, ShipOwner} = require('./models');

# 特殊砲撃: 0=通常, 1=レーザー攻撃, 2=連撃, 3=カットイン(主砲/副砲), 4=カットイン(主砲/電探), 5=カットイン(主砲/徹甲), 6=カットイン(主砲/主砲)
DayAttackTypeMap =
  0: AttackType.Normal,
  1: AttackType.Laser,
  2: AttackType.Double,
  3: AttackType.Primary_Secondary_CI,
  4: AttackType.Primary_Radar_CI,
  5: AttackType.Primary_AP_CI,
  6: AttackType.Primary_Primary_CI,

# 夜戦攻撃: 0=通常攻撃, 1=連撃, 2=カットイン(主砲/魚雷), 3=カットイン(魚雷/魚雷), 4=カットイン(主砲/副砲), 5=カットイン(主砲/主砲)
NightAttackTypeMap =
  0: AttackType.Normal,
  1: AttackType.Double,
  2: AttackType.Primary_Torpedo_CI,
  3: AttackType.Torpedo_Torpedo_CI,
  4: AttackType.Primary_Secondary_CI,
  5: AttackType.Primary_Primary_CI,

SupportTypeMap =
  1: StageType.Aerial
  2: StageType.Shelling
  3: StageType.Torpedo

useItem = (ship) ->
  if ship.owner == ShipOwner.Ours && ship.nowHP <= 0 && ship.items != null
    for itemId in ship.items
      # 応急修理要員
      if itemId == 42
        ship.nowHP = Math.floor(ship.maxHP / 5);
        return itemId;
      # 応急修理女神
      if itemId == 43
        ship.nowHP = ship.maxHP;
        return itemId;
  return null;

damageShip = (ship, damage) ->
  return unless ship?
  fromHP = ship.nowHP
  ship.nowHP -= damage
  ship.lostHP += damage
  item = useItem(ship)
  ship.useItem = item
  toHP = ship.nowHP
  # `ship.*` is updated in place
  return {fromHP, toHP, item}

simulateAerialAttack = (ships, edam, ebak_flag, erai_flag, ecl_flag) ->
  list = []
  return list unless ships? and edam?
  for damage, i in edam
    continue if i == 0
    continue if (ebak_flag[i] <= 0 && erai_flag[i] <= 0)
    toShip = ships[i - 1]
    damage = Math.floor(damage)
    hit = if ecl_flag[i] == 1 then HitType.Critical else if damage > 0 then HitType.Hit else HitType.Miss
    {fromHP, toHP, item} = damageShip(toShip, damage)
    list.push new Attack
      type:   AttackType.Normal
      toShip: toShip
      damage: [damage]
      hit:    [hit]
      fromHP: fromHP
      toHP:   toHP
      useItem: item
  return list

simulateAerial = (mainFleet, escortFleet, enemyFleet, enemyEscort, kouku) ->
  return unless kouku?
  attacks = []
  if kouku.api_stage3?
    st3 = kouku.api_stage3
    attacks = attacks.concat(simulateAerialAttack(enemyFleet, st3.api_edam, st3.api_ebak_flag, st3.api_erai_flag, st3.api_ecl_flag))
    attacks = attacks.concat(simulateAerialAttack(mainFleet, st3.api_fdam, st3.api_fbak_flag, st3.api_frai_flag, st3.api_fcl_flag))
  if kouku.api_stage3_combined?
    st3 = kouku.api_stage3_combined
    attacks = attacks.concat(simulateAerialAttack(enemyEscort, st3.api_edam, st3.api_ebak_flag, st3.api_erai_flag, st3.api_ecl_flag))
    attacks = attacks.concat(simulateAerialAttack(escortFleet, st3.api_fdam, st3.api_fbak_flag, st3.api_frai_flag, st3.api_fcl_flag))
  return new Stage
    type: StageType.Aerial
    attacks: attacks
    kouku: kouku

simulateTorpedoAttack = (fleet, targetFleet, targetEscort, api_eydam, api_erai, api_ecl) ->
  list = []
  return list unless targetFleet? and api_eydam?
  for target, i in api_erai
    continue if target <= 0
    if 1 <= target <= 6
      toShip = targetFleet[target - 1]
    if 7 <= target <= 12
      toShip = targetEscort[target - 7]
    damage = Math.floor(api_eydam[i])
    hit = if api_ecl[i] == 2 then HitType.Critical else if api_ecl[i] == 1 then HitType.Hit else HitType.Miss
    {fromHP, toHP, item} = damageShip(toShip, damage)
    list.push new Attack
      type:   AttackType.Normal
      fromShip: fleet[i - 1]
      toShip: toShip
      damage: [damage]
      hit:    [hit]
      fromHP: fromHP
      toHP:   toHP
      useItem: item
  return list

simulateTorpedo = (fleet, enemyFleet, enemyEscort, raigeki, subtype) ->
  return unless raigeki?
  attacks = []
  if raigeki.api_frai?
    attacks = attacks.concat(simulateTorpedoAttack(fleet, enemyFleet, enemyEscort, raigeki.api_fydam, raigeki.api_frai, raigeki.api_fcl))
  if raigeki.api_erai?
    attacks = attacks.concat(simulateTorpedoAttack(enemyFleet, fleet, null, raigeki.api_eydam, raigeki.api_erai, raigeki.api_ecl))
  return new Stage
    type: StageType.Torpedo
    attacks: attacks
    subtype: subtype

simulateShelling = (fleet, enemyFleet, enemyEscort, hougeki, subtype) ->
  return unless hougeki?
  isNight = (subtype == StageType.Night)
  list = []
  for at, i in hougeki.api_at_list
    continue if at == -1
    at -= 1                             # Attacker
    df = hougeki.api_df_list[i][0] - 1  # Defender
    if hougeki.api_at_eflag?
      fromEnemy = hougeki.api_at_eflag[i] == 1
    else
      fromEnemy = df < 6
      if at >= 6 then at -= 6
      if df >= 6 then df -= 6
    if fromEnemy
      fromShip = enemyFleet[at]
      toShip = fleet[df]
    else
      fromShip = fleet[at]
      toShip = if df < 6 then enemyFleet[df] else enemyEscort[df - 6]

    attackType = if isNight then NightAttackTypeMap[hougeki.api_sp_list[i]] else DayAttackTypeMap[hougeki.api_at_type[i]]
    damage = []
    damageTotal = 0
    for dmg in hougeki.api_damage[i]
      dmg = Math.floor(dmg)
      dmg = 0 if dmg < 0
      damage.push dmg
      damageTotal += dmg
    hit = []
    for cl in hougeki.api_cl_list[i]
      hit.push if cl == 2 then HitType.Critical else if cl == 1 then HitType.Hit else HitType.Miss
    {fromHP, toHP, item} = damageShip(toShip, damageTotal)
    list.push new Attack
      type:   attackType
      fromShip: fromShip
      toShip: toShip
      damage: damage
      hit:    hit
      fromHP: fromHP
      toHP:   toHP
      useItem: item
  return new Stage
    type: StageType.Shelling
    attacks: list
    subtype: subtype

simulateNight = (fleet, enemyFleet, hougeki, packet) ->
  stage = simulateShelling(fleet, enemyFleet, null, hougeki, StageType.Night)
  stage.api = _.pick(packet, 'api_touch_plane', 'api_flare_pos')
  return stage

simulateSupport = (enemyShip, support, flag) ->
  return unless support? and flag?
  if flag == 1
    kouku = support.api_support_airatack
    attacks = []
    if kouku?.api_stage3?
      st3 = kouku.api_stage3
      attacks = simulateAerialAttack(enemyShip, st3.api_edam, st3.api_ebak_flag, st3.api_erai_flag, st3.api_ecl_flag)
    return new Stage
      type: StageType.Support
      attacks: attacks
      kouku: kouku
      subtype: SupportTypeMap[flag]
  else if flag == 2 or flag == 3
    attacks = []
    hourai = support.api_support_hourai
    for damage, i in hourai.api_damage
      continue unless 1 <= i <= 6
      damage = Math.floor(damage)
      cl = hourai.api_cl_list[i]
      hit = if cl == 2 then HitType.Critical else if cl == 1 then HitType.Hit else HitType.Miss
      toShip = enemyShip[i - 1]
      {fromHP, toHP, item} = damageShip(toShip, damage)
      attacks.push new Attack
        type:   AttackType.Normal
        toShip: toShip
        damage: [damage]
        hit:    [hit]
        fromHP: fromHP
        toHP:   toHP
        useItem: item
    return new Stage
      type: StageType.Support
      attacks: attacks
      subtype: SupportTypeMap[flag]

simulateLandBase = (enemyFleet, enemyEscort, kouku) ->
  stage = simulateAerial(null, null, enemyFleet, enemyEscort, kouku)
  stage.type = StageType.LandBase
  return stage

getEngagementStage = (packet) ->
  picks = _.pick(packet, 'api_search', 'api_formation')
  picks.gimmick = [packet.api_boss_damaged, packet.api_xal01].find((x) -> x?)
  return new Stage
    type: StageType.Engagement
    api: picks

class Simulator2
  constructor: (fleet) ->
    # >> package-manager.es L103
    @fleetType    = fleet.type || 0
    @mainFleet    = @initFleet(fleet.main, 0)
    @escortFleet  = @initFleet(fleet.escort, 6)
    @supportFleet = @initFleet(fleet.support)
    @enemyFleet   = null  # Assign at first packet
    @enemyEscort  = null  # ^
    @landBaseAirCorps = fleet.LBAC

  initFleet: (rawFleet, intl=0) ->
    return unless rawFleet?
    fleet = []
    for rawShip, i in rawFleet
      if rawShip?
        slots = rawShip.poi_slot.concat(rawShip.poi_slot_ex)
        fleet.push new Ship
          id:    rawShip.api_ship_id
          owner: ShipOwner.Ours
          pos:   i + 1
          maxHP: rawShip.api_maxhp
          nowHP: rawShip.api_nowhp
          items: slots.map (slot) -> slot?.api_slotitem_id
          raw:   rawShip
      else
        fleet.push null
    return fleet

  initEnemy: (packet) ->
    # Main Fleet
    main = []
    if packet.api_ship_ke?
      for i in [1..6]
        break unless packet.api_ship_ke[i]?
        slots = packet.api_eSlot[i - 1] || []
        main.push new Ship
          id:    packet.api_ship_ke[i]
          owner: ShipOwner.Enemy
          pos:   i  # [1..6]
          maxHP: packet.api_maxhps[i + 6]
          nowHP: packet.api_nowhps[i + 6]
          items: []  # We dont care
          raw:
            api_ship_id: packet.api_ship_ke[i]
            api_lv: packet.api_ship_lv[i]
            poi_slot: slots.map((id) => $slotitems[id])
    # Escort Fleet
    escort = []
    if packet.api_ship_ke_combined?
      for i in [1..6]
        break unless packet.api_ship_ke_combined[i]?
        slots = packet.api_eSlot_combined[i - 1] || []
        escort.push new Ship
          id:    packet.api_ship_ke_combined[i]
          owner: ShipOwner.Enemy
          pos:   i + 6  # [7..12]
          maxHP: packet.api_maxhps_combined[i + 6]
          nowHP: packet.api_nowhps_combined[i + 6]
          items: []  # We dont care
          raw:
            api_ship_id: packet.api_ship_ke_combined[i]
            api_lv: packet.api_ship_lv_combined[i]
            poi_slot: slots.map((id) => $slotitems[id])
    return [main, escort]

  simulate: (packet) ->
    return unless packet?
    if (not @enemyFleet?)
      [@enemyFleet, @enemyEscort] = @initEnemy(packet)
    
    stages = []
    path = packet.poi_path

    # HACK: Only enemy carrier task force now.
    enemyType = 0
    if path.includes('ec_')
      enemyType = 1

    if path in ['/kcsapi/api_req_sortie/battle',
                '/kcsapi/api_req_practice/battle',
                '/kcsapi/api_req_sortie/airbattle',
                '/kcsapi/api_req_sortie/ld_airbattle',
                '/kcsapi/api_req_combined_battle/battle',
                '/kcsapi/api_req_combined_battle/battle_water',
                '/kcsapi/api_req_combined_battle/airbattle',
                '/kcsapi/api_req_combined_battle/ld_airbattle',
                '/kcsapi/api_req_combined_battle/ec_battle']
      # Engagement
      stages.push getEngagementStage(packet)
      # Land base air attack
      for api_kouku in packet.api_air_base_attack || []
        stages.push simulateLandBase(@enemyFleet, @enemyEscort, api_kouku)
      # Aerial Combat
      stages.push simulateAerial(@mainFleet, @escortFleet, @enemyFleet, @enemyEscort, packet.api_kouku)
      # Aerial Combat 2nd
      stages.push simulateAerial(@mainFleet, @escortFleet, @enemyFleet, @enemyEscort, packet.api_kouku2)
      # Expedition Support Fire
      stages.push simulateSupport(@enemyFleet, packet.api_support_info, packet.api_support_flag)

      # Normal Fleet
      if @fleetType == 0
        if enemyType == 0
          # Opening Anti-Sub
          stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_opening_taisen, StageType.Opening)
          # Opening Torpedo Salvo
          stages.push simulateTorpedo(@mainFleet, @enemyFleet, null, packet.api_opening_atack, StageType.Opening)
          # Shelling (Main), 1st
          stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_hougeki1, null)
          # Shelling (Main), 2nd
          stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_hougeki2, null)
          # Closing Torpedo Salvo
          stages.push simulateTorpedo(@mainFleet, @enemyFleet, null, packet.api_raigeki)
        if enemyType == 1
          # Opening Anti-Sub
          stages.push simulateShelling(@mainFleet, @enemyFleet, @enemyEscort, packet.api_opening_taisen, StageType.Opening)
          # Opening Torpedo Salvo
          stages.push simulateTorpedo(@mainFleet, @enemyFleet, @enemyEscort, packet.api_opening_atack, StageType.Opening)
          # Shelling (Escort)
          stages.push simulateShelling(@mainFleet, @enemyFleet, @enemyEscort, packet.api_hougeki1, null)
          # Closing Torpedo Salvo
          stages.push simulateTorpedo(@mainFleet, @enemyFleet, @enemyEscort, packet.api_raigeki)
          # Shelling (Any), 1st
          stages.push simulateShelling(@mainFleet, @enemyFleet, @enemyEscort, packet.api_hougeki2, null)
          # Shelling (Any), 2nd
          stages.push simulateShelling(@mainFleet, @enemyFleet, @enemyEscort, packet.api_hougeki3, null)

      # Surface Task Force, 水上打撃部隊
      if @fleetType == 2
        # Opening Anti-Sub
        stages.push simulateShelling(@escortFleet, @enemyFleet, null, packet.api_opening_taisen, StageType.Opening)
        # Opening Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, null, packet.api_opening_atack, StageType.Opening)
        # Shelling (Main), 1st
        stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_hougeki1, StageType.Main)
        # Shelling (Main), 2nd
        stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_hougeki2, StageType.Main)
        # Shelling (Escort)
        stages.push simulateShelling(@escortFleet, @enemyFleet, null, packet.api_hougeki3, StageType.Escort)
        # Closing Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, null, packet.api_raigeki)

      # Carrier Task Force, 空母機動部隊
      # Transport Escort, 輸送護衛部隊
      if @fleetType == 1 or @fleetType == 3
        # Opening Anti-Sub
        stages.push simulateShelling(@escortFleet, @enemyFleet, null, packet.api_opening_taisen, StageType.Opening)
        # Opening Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, null, packet.api_opening_atack, StageType.Opening)
        # Shelling (Escort)
        stages.push simulateShelling(@escortFleet, @enemyFleet, null, packet.api_hougeki1, StageType.Escort)
        # Closing Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, null, packet.api_raigeki)
        # Shelling (Main), 1st
        stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_hougeki2, StageType.Main)
        # Shelling (Main), 2nd
        stages.push simulateShelling(@mainFleet, @enemyFleet, null, packet.api_hougeki3, StageType.Main)

    if path in ['/kcsapi/api_req_battle_midnight/battle',
                '/kcsapi/api_req_practice/midnight_battle',
                '/kcsapi/api_req_battle_midnight/sp_midnight',
                '/kcsapi/api_req_combined_battle/midnight_battle',
                '/kcsapi/api_req_combined_battle/sp_midnight',
                '/kcsapi/api_req_combined_battle/ec_midnight_battle']
      if @fleetType == 0
        if enemyType == 0
          stages.push simulateNight(@mainFleet, @enemyFleet, packet.api_hougeki, packet)
        if enemyType == 1
          # HACK: GUESS: api_active_deck
          #hp = @enemyEscort.reduce(
          #  (pre, ship) -> pre + (ship.nowHP || 0)
          #, 0)
          if packet.api_active_deck[1] == 1
            stages.push simulateNight(@mainFleet, @enemyFleet, packet.api_hougeki, packet)
          else
            stages.push simulateNight(@mainFleet, @enemyEscort, packet.api_hougeki, packet)
      else
        stages.push simulateNight(@escortFleet, @enemyFleet, packet.api_hougeki, packet)

    return stages


module.exports = Simulator2
