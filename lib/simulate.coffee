####
# Usage: Pass response body as argument with extra key-value below.
# poi_is_combined = Boolean # 連合艦隊？
# poi_is_water = Boolean    # 水上打撃部隊=true, 空母機動部隊=false
# poi_is_night = Boolean    # 夜戦？
# poi_sortie_fleet = [int, ...] # api_ship_id
# poi_sortie_equipment = [[int, ...], ...]  # api_slotitem_id
# poi_combined_fleet = [int, ...]
# poi_combined_equipment = [[int, ...], ...]
####

{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require './common'


# 特殊砲撃　0=通常, 1=レーザー攻撃, 2=連撃, 3=カットイン(主砲/副砲), 4=カットイン(主砲/電探), 5=カットイン(主砲/徹甲), 6=カットイン(主砲/主砲)
checkAttackType = [
  "Normal",
  "Laser",
  "Double",
  "Primary_Secondary_CI",
  "Primary_Radar_CI",
  "Primary_AP_CI",
  "Primary_Primary_CI",
  "Primary_Torpedo_CI",
  "Torpedo_Torpedo_CI"
]
# NightID DayID Type
# 0       0     通常攻撃
# 1       2     連撃
# 2       7     カットイン(主砲/魚雷)
# 3       8     カットイン(魚雷/魚雷)
# 4       3     カットイン(主砲/副砲)
# 5       6     カットイン(主砲/主砲)
checkNightAttackType = [
  0,
  2,
  7,
  8,
  3,
  6
]

checkRepairItem = (sortieShip) ->
  if sortieShip.hp[0] <= 0
    for id, i in sortieShip.equipment
      if id == 42
        sortieShip.hp[0] = Math.floor(sortieShip.hp[1] / 5)
        break
      else if id == 43
        sortieShip.hp[0] = sortieShip.hp[1]
        break

AerialCombat = (sortieShip, enemyShip, kouku) ->
  list = []
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      continue if (kouku.api_ebak_flag <= 0 && kouku.api_erai_flag <= 0) || i == 0
      damage = Math.floor(damage)
      dmg = []
      dmg.push damage
      critical = []
      critical.push kouku.api_ecl_flag[i] == 1
      list.push new Attack AttackType[checkAttackType[0]], null, enemyShip[i - 1], enemyShip[i - 1].hp[1], enemyShip[i - 1].hp[0], dmg, critical
      enemyShip[i - 1].hp[0] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      continue if kouku.api_fbak_flag <= 0 && kouku.api_frai_flag <= 0
      damage = Math.floor(damage)
      dmg = []
      dmg.push damage
      critical = []
      critical.push kouku.api_fcl_flag[i] == 1
      list.push new Attack AttackType[checkAttackType[0]], null, sortieShip[i - 1], sortieShip[i - 1].hp[1], sortieShip[i - 1].hp[0], dmg, critical
      sortieShip[i - 1].hp[0] -= damage
      checkRepairItem sortieShip[i - 1]
  # test log
  #console.log list
  list

SupportFire = (enemyShip, support) ->
  list = []
  for damage, i in support
    continue unless 1 <= i <= 6
    damage = Math.floor(damage)
    dmg = []
    dmg.push damage
    critical = []
    critical.push false   # TODO: Aerial support may be cirtical attack.
    list.push new Attack AttackType[checkAttackType[0]], null, enemyShip[i - 1], enemyShip[i - 1].hp[1], enemyShip[i - 1].hp[0], dmg, critical
    enemyShip[i - 1].hp[0] -= damage
  list

#api_opening_atack	：開幕雷撃戦 *スペルミスあり、注意
#		api_frai		：雷撃ターゲット
#		api_erai		：
#		api_fdam		：被ダメージ
#		api_edam		：
#		api_fydam		：与ダメージ
#		api_eydam		：
#		api_fcl			：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
#		api_ecl			：攻撃側に記述される

TorpedoSalvo = (sortieShip, enemyShip, raigeki) ->
  list = []
  # 雷撃ターゲット
  for target, i in raigeki.api_frai
    continue if target <= 0
    damage = Math.floor(raigeki.api_fydam[i])
    dmg = []
    dmg.push damage
    # クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
    critical = []
    for crt, j in raigeki.api_fcl[i]
      critical.push crt == 2
    list.push new Attack AttackType[checkAttackType[0]], sortieShip[i - 1], enemyShip[target - 1], enemyShip[target - 1].hp[1], enemyShip[target - 1].hp[0], dmg, critical
    enemyShip[target - 1].hp[0] -= damage
  # 雷撃ターゲット
  for target, i in raigeki.api_erai
    continue if target <= 0
    damage = Math.floor(raigeki.api_eydam[i])
    dmg = []
    dmg.push damage
    # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
    critical = []
    for crt, j in raigeki.api_ecl[i]
      critical.push crt == 2
    list.push new Attack AttackType[checkAttackType[0]], enemyShip[i - 1], sortieShip[target - 1], sortieShip[target - 1].hp[1], sortieShip[target - 1].hp[0], dmg, critical
    sortieShip[target - 1].hp[0] -= damage
    checkRepairItem sortieShip[i - 1]
  # test log
  #console.log list
  list

Shelling = (sortieShip, enemyShip, hougeki, isNight) ->
  list = []
  # 砲撃戦行動順
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    damageFrom -= 1
    dmg = []
    totalDamage = 0
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      dmg.push damage
      totalDamage += damage
    critical = []
    for crt, j in hougeki.api_cl_list[i]
      critical.push crt == 2
    target = hougeki.api_df_list[i][0] - 1
    attackType = 0
    if !isNight
      attackType = hougeki.api_at_type[i]
    else
      attackType = checkNightAttackType[hougeki.api_sp_list[i]]
    if target < 6
      # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル　命中(0ダメージ)も存在する？
      list.push new Attack AttackType[checkAttackType[attackType]], enemyShip[damageFrom - 6], sortieShip[target], sortieShip[target].hp[1], sortieShip[target].hp[0], dmg, critical
      sortieShip[target].hp[0] -= totalDamage
      checkRepairItem sortieShip[i - 1]
    else
      # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル　命中(0ダメージ)も存在する？
      list.push new Attack AttackType[checkAttackType[attackType]], sortieShip[damageFrom], enemyShip[target - 6], enemyShip[target - 6].hp[1], enemyShip[target - 6].hp[0], dmg, critical
      enemyShip[target - 6].hp[0] -= totalDamage
  # test log
  #console.log list
  list

# req needs the api_data name
module.exports =
  simulate: (req) ->
    isCombined = req.poi_is_combined
    isWater = !req.poi_is_carrier
    # Initialization of sortieShip
    sortieShip = []
    enemyShip = []
    combinedShip = []
    sortiePos = 0
    sortiePos = req.api_deck_id - 1 if !isCombined
    for i in [0..5]
      sortieShip.push new Ship ShipOwner.Ours, req.poi_sortie_fleet[i], i + 1, [req.api_nowhps[i + 1], req.api_maxhps[i + 1]], req.poi_sortie_equipment[i]
      enemyShip.push new Ship ShipOwner.Enemy, req.api_ship_ke[i + 1], i + 1, [req.api_nowhps[i + 7], req.api_maxhps[i + 7]], req.poi_combined_equipment[i]
      if isCombined
        combinedShip.push new Ship ShipOwner.Ours, req.poi_combined_fleet[i], i + 1, [req.api_nowhps[i + 13], req.api_maxhps[i + 13]]
    sortieProgress = []

    # Air battle
    if req.api_kouku?
      if req.api_kouku.api_stage3?
        sortieProgress.push new Stage StageType.AerialCombat, AerialCombat sortieShip, enemyShip, req.api_kouku.api_stage3
      if req.api_kouku.api_stage3_combined?
        sortieProgress.push new Stage StageType.AerialCombat, AerialCombat combinedShip, enemyShip, req.api_kouku.api_stage3_combined

    # Second air battle
    if req.api_kouku2?
      if req.api_kouku2.api_stage3?
        sortieProgress.push new Stage StageType.AerialCombat, AerialCombat sortieShip, enemyShip, req.api_kouku2.api_stage3
      if req.api_kouku2.api_stage3_combined?
        sortieProgress.push new Stage StageType.AerialCombat, AerialCombat combinedShip, enemyShip, req.api_kouku2.api_stage3_combined

    # Support battle
    if req.api_support_info?
      if req.api_support_info.api_support_airatack?
        sortieProgress.push new Stage StageType.Support, SupportFire enemyShip, req.api_support_info.api_support_airatack.api_stage3.api_edam
      else if req.api_support_info.api_support_hourai?
        sortieProgress.push new Stage StageType.Support, SupportFire enemyShip, req.api_support_info.api_support_hourai.api_damage
      else
        sortieProgress.push new Stage StageType.Support, SupportFire enemyShip, req.api_support_info.api_damage

    # Opening battle
    if req.api_opening_atack?
      if isCombined
        sortieProgress.push new Stage StageType.TorpedoSalvo, TorpedoSalvo combinedShip, enemyShip, req.api_opening_atack
      else
        sortieProgress.push new Stage StageType.TorpedoSalvo, TorpedoSalvo sortieShip, enemyShip, req.api_opening_atack

    # First hougeki battle
    if req.api_hougeki1?
      if isCombined && !isWater
        sortieProgress.push new Stage StageType.Shelling, Shelling combinedShip, enemyShip, req.api_hougeki1, false
      else
        sortieProgress.push new Stage StageType.Shelling, Shelling sortieShip, enemyShip, req.api_hougeki1, false

    # Combined fleet raigeki
    if req.api_raigeki? && isCombined && !isWater
      sortieProgress.push new Stage StageType.TorpedoSalvo, TorpedoSalvo combinedShip, enemyShip, req.api_raigeki

    # Second hougeki battle
    if req.api_hougeki2?
      sortieProgress.push new Stage StageType.Shelling, Shelling sortieShip, enemyShip, req.api_hougeki2, false

    # Combined hougeki battle
    if req.api_hougeki3?
      if isCombined && isWater
        sortieProgress.push new Stage StageType.Shelling, Shelling combinedShip, enemyShip, req.api_hougeki3, false
      else
        sortieProgress.push new Stage StageType.Shelling, Shelling sortieShip, enemyShip, req.api_hougeki3, false

    # Raigeki battle
    if req.api_raigeki?
      if isCombined
        if isWater
          sortieProgress.push new Stage StageType.TorpedoSalvo, TorpedoSalvo combinedShip, enemyShip, req.api_raigeki
      else
        sortieProgress.push new Stage StageType.TorpedoSalvo, TorpedoSalvo sortieShip, enemyShip, req.api_raigeki

    # Night battle
    if req.api_hougeki?
      if isCombined
        sortieProgress.push new Stage StageType.Shelling, Shelling combinedShip, enemyShip, req.api_hougeki, true
      else
        sortieProgress.push new Stage StageType.Shelling, Shelling sortieShip, enemyShip, req.api_hougeki, true
    sortieProgress
