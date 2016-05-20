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

simulateAerialAttack = (ships, edam, ebak_flag, erai_flag, ecl_flag) ->
  list = []
  return list unless ships? and edam?
  for damage, i in edam
    continue if i == 0
    continue if (ebak_flag[i] <= 0 && erai_flag[i] <= 0)
    toShip = ships[i - 1]
    damage = Math.floor(damage)
    hit = if ecl_flag[i] == 1 then HitType.Critical else if damage > 0 then HitType.Hit else HitType.Miss
    fromHP = toShip.nowHP
    toShip.nowHP -= damage
    item = useItem(toShip)
    toHP = toShip.nowHP
    list.push new Attack
      type:   AttackType.Normal
      toShip: toShip
      damage: [damage]
      hit:    [hit]
      fromHP: fromHP
      toHP:   toHP
      useItem: item
  return list

simulateAerial = (mainFleet, escortFleet, enemyFleet, kouku) ->
  return unless kouku?
  attacks = []
  if kouku.api_stage3?
    st3 = kouku.api_stage3
    attacks = attacks.concat(simulateAerialAttack(enemyFleet, st3.api_edam, st3.api_ebak_flag, st3.api_erai_flag, st3.api_ecl_flag))
    attacks = attacks.concat(simulateAerialAttack(mainFleet, st3.api_fdam, st3.api_fbak_flag, st3.api_frai_flag, st3.api_fcl_flag))
  if kouku.api_stage3_combined?
    st3 = kouku.api_stage3_combined
    attacks = attacks.concat(simulateAerialAttack(escortFleet, st3.api_fdam, st3.api_fbak_flag, st3.api_frai_flag, st3.api_fcl_flag))
  return new Stage
    type: StageType.Aerial
    attacks: attacks
    kouku: kouku

simulateTorpedoAttack = (fleet, targetFleet, api_eydam, api_erai, api_ecl) ->
  list = []
  return list unless targetFleet? and api_eydam?
  for target, i in api_erai
    continue if target <= 0
    toShip = targetFleet[target - 1]
    damage = Math.floor(api_eydam[i])
    hit = if api_ecl[i] == 2 then HitType.Critical else if api_ecl[i] == 1 then HitType.Hit else HitType.Miss
    fromHP = toShip.nowHP
    toShip.nowHP -= damage
    item = useItem(toShip)
    toHP = toShip.nowHP
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

simulateTorpedo = (fleet, enemyFleet, raigeki) ->
  return unless raigeki?
  attacks = []
  if raigeki.api_erai?
    attacks = attacks.concat(simulateTorpedoAttack(enemyFleet, fleet, raigeki.api_eydam, raigeki.api_erai, raigeki.api_ecl))
  if raigeki.api_frai?
    attacks = attacks.concat(simulateTorpedoAttack(fleet, enemyFleet, raigeki.api_fydam, raigeki.api_frai, raigeki.api_fcl))
  return new Stage
    type: StageType.Torpedo
    attacks: attacks

simulateShelling = (fleet, enemyFleet, hougeki, isNight=false) ->
  return unless hougeki?
  list = []
  for from, i in hougeki.api_at_list
    continue if from == -1
    from -= 1
    attackType = if isNight then NightAttackTypeMap[hougeki.api_sp_list[i]] else DayAttackTypeMap[hougeki.api_at_type[i]]
    damage = []
    damageTotal = 0
    for dmg in hougeki.api_damage[i]
      dmg = Math.floor(dmg)
      damage.push dmg
      damageTotal += dmg
    hit = []
    for cl in hougeki.api_cl_list[i]
      hit.push if cl == 2 then HitType.Critical else if cl == 1 then HitType.Hit else HitType.Miss
    target = hougeki.api_df_list[i][0] - 1
    if target < 6
      fromShip = enemyFleet[from - 6]
      toShip = fleet[target]
    else
      fromShip = fleet[from]
      toShip = enemyFleet[target - 6]
    fromHP = toShip.nowHP
    toShip.nowHP -= damageTotal
    item = useItem(toShip)
    toHP = toShip.nowHP
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
      fromHP = toShip.nowHP
      toShip.nowHP -= damage
      # item = useItem(toShip)
      toHP = toShip.nowHP
      attacks.push new Attack
        type:   AttackType.Normal
        toShip: toShip
        damage: [damage]
        hit:    [hit]
        fromHP: fromHP
        toHP:   toHP
      #  useItem: item
    return new Stage
      type: StageType.Support
      attacks: attacks
      subtype: SupportTypeMap[flag]

simulateLandBase = (enemyShip, kouku) ->
  return unless kouku?
  attacks = []
  if kouku.api_stage3?
    st3 = kouku.api_stage3
    attacks = attacks.concat(simulateAerialAttack(enemyShip, st3.api_edam, st3.api_ebak_flag, st3.api_erai_flag, st3.api_ecl_flag))
  return new Stage
    type: StageType.LandBase
    attacks: attacks
    kouku: kouku

class Simulator2
  constructor: (fleet) ->
    @fleetType   = fleet.type
    @mainFleet   = @initFleet(fleet.main)
    @escortFleet = @initFleet(fleet.escort)
    @enemyFleet  = null;  # Assign at first packet

  initFleet: (rawFleet) ->
    return unless rawFleet?
    fleet = []
    for rawShip, i in rawFleet
      slots = rawShip.poi_slot.concat(rawShip.poi_slot_ex)
      fleet.push new Ship
        id:    rawShip.api_ship_id
        owner: ShipOwner.Ours
        pos:   i + 1
        maxHP: rawShip.api_maxhp
        nowHP: rawShip.api_nowhp
        items: slots.map (slot) -> slot?.api_slotitem_id
    return fleet

  simulate: (packet) ->
    return unless packet?

    if (not @enemyFleet?) and packet.api_ship_ke?
      @enemyFleet = []
      for i in [1..6]
        @enemyFleet.push new Ship
          id:    packet.api_ship_ke[i]
          owner: ShipOwner.Enemy
          pos:   i
          maxHP: packet.api_maxhps[i + 6]
          nowHP: packet.api_nowhps[i + 6]
          items: []  # We dont care
    
    stages = []
    path = packet.poi_path

    if path in ['/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_sortie/airbattle', '/kcsapi/api_req_combined_battle/battle', '/kcsapi/api_req_combined_battle/battle_water', '/kcsapi/api_req_combined_battle/airbattle']
      # Land base air attack
      for api_kouku in packet.api_air_base_attack || []
        stages.push simulateAerial(@mainFleet, @escortFleet, @enemyFleet, api_kouku)
      # Aerial Combat
      stages.push simulateAerial(@mainFleet, @escortFleet, @enemyFleet, packet.api_kouku)
      # Aerial Combat 2nd
      stages.push simulateAerial(@mainFleet, @escortFleet, @enemyFleet, packet.api_kouku2)
      # Expedition Support Fire
      stages.push simulateSupport(@enemyFleet, packet.api_support_info, packet.api_support_flag)

      # Normal Fleet
      if @fleetType == 0
        # Opening Torpedo Salvo
        stages.push simulateTorpedo(@mainFleet, @enemyFleet, packet.api_opening_atack)
        # Shelling (Main), 1st
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki1)
        # Shelling (Main), 2st
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki2)
        # Closing Torpedo Salvo
        stages.push simulateTorpedo(@mainFleet, @enemyFleet, packet.api_raigeki)

      # Surface Task Force, 水上打撃部隊
      if @fleetType == 2
        # Opening Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, packet.api_opening_atack)
        # Shelling (Main), 1st
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki1)
        # Shelling (Main), 2st
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki2)
        # Shelling (Escort)
        stages.push simulateShelling(@escortFleet, @enemyFleet, packet.api_hougeki3)
        # Closing Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, packet.api_raigeki)

      # Carrier Task Force, 空母機動部隊
      # Transport Escort, 輸送護衛部隊
      if @fleetType == 1 or @fleetType == 3
        # Opening Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, packet.api_opening_atack)
        # Shelling (Escort)
        stages.push simulateShelling(@escortFleet, @enemyFleet, packet.api_hougeki1)
        # Closing Torpedo Salvo
        stages.push simulateTorpedo(@escortFleet, @enemyFleet, packet.api_raigeki)
        # Shelling (Main), 1st
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki2)
        # Shelling (Main), 2st
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki3)

    if path in ['/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_practice/midnight_battle', '/kcsapi/api_req_battle_midnight/sp_midnight', '/kcsapi/api_req_combined_battle/midnight_battle', '/kcsapi/api_req_combined_battle/sp_midnight']
      if @fleetType == 0
        stages.push simulateShelling(@mainFleet, @enemyFleet, packet.api_hougeki, true)
      else
        stages.push simulateShelling(@escortFleet, @enemyFleet, packet.api_hougeki, true)

    return stages


module.exports = Simulator2
