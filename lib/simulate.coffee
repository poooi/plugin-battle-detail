{Ship, ShipOwner, Attack, AttackType, HitType, Stage, StageType} = require './common'


# Map from api id of attack type to AttackType
# 特殊砲撃 0=通常, 1=レーザー攻撃, 2=連撃, 3=カットイン(主砲/副砲), 4=カットイン(主砲/電探), 5=カットイン(主砲/徹甲), 6=カットイン(主砲/主砲)
AttackTypeMap =
  0: AttackType.Normal
  1: AttackType.Laser
  2: AttackType.Double
  3: AttackType.Primary_Secondary_CI
  4: AttackType.Primary_Radar_CI
  5: AttackType.Primary_AP_CI
  6: AttackType.Primary_Primary_CI
# Map from api id of night attack type to day attack type id
# 夜戦攻撃種別 0=通常攻撃, 1=連撃, 2=カットイン(主砲/魚雷), 3=カットイン(魚雷/魚雷), 4=カットイン(主砲/副砲), 5=カットイン(主砲/主砲)
NightAttackTypeMap =
  0: AttackType.Normal
  1: AttackType.Double
  2: AttackType.Primary_Torpedo_CI
  3: AttackType.Torpedo_Torpedo_CI
  4: AttackType.Primary_Secondary_CI
  5: AttackType.Primary_Primary_CI


checkRepairItem = (sortieShip) ->
  if sortieShip.nowHP <= 0 && sortieShip.equipment?
    for id, i in sortieShip.equipment
      if id == 42
        sortieShip.nowHP = Math.floor(sortieShip.maxHP / 5)
        return 42
      else if id == 43
        sortieShip.nowHP = sortieShip.maxHP
        return 43
  return NaN

simulateAerialCombat = (sortieShip, enemyShip, kouku) ->
  list = []
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      continue if (kouku.api_ebak_flag[i] <= 0 && kouku.api_erai_flag[i] <= 0) || i == 0
      damage = Math.floor(damage)
      dmg = []
      dmg.push damage
      critical = []
      critical.push if kouku.api_ecl_flag[i] == 1 then HitType.Critical else if damage == 0 then HitType.Miss else HitType.Hit
      enemyShip[i - 1].nowHP -= damage
      list.push new Attack AttackType.Normal, null, enemyShip[i - 1], enemyShip[i - 1].maxHP, enemyShip[i - 1].nowHP, dmg, critical
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      continue if (kouku.api_fbak_flag[i] <= 0 && kouku.api_frai_flag[i] <= 0) || i == 0
      damage = Math.floor(damage)
      dmg = []
      dmg.push damage
      critical = []
      critical.push if kouku.api_fcl_flag[i] == 1 then HitType.Critical else if damage == 0 then HitType.Miss else HitType.Hit
      sortieShip[i - 1].nowHP -= damage
      useItem = checkRepairItem sortieShip[i - 1]
      list.push new Attack AttackType.Normal, null, sortieShip[i - 1], sortieShip[i - 1].maxHP, sortieShip[i - 1].nowHP, dmg, critical, useItem
  # test log
  #console.log list
  list

simulateSupportFire = (enemyShip, support) ->
  list = []
  if support.api_support_airatack?
    for damage, i in support.api_support_airatack.api_stage3.api_edam
      continue unless 1 <= i <= 6
      damage = Math.floor(damage)
      dmg = []
      dmg.push damage
      critical = []
      if support.api_support_airatack.api_stage3.api_ecl_flag[i] == 2
        critical.push HitType.Critical
      else if support.api_support_airatack.api_stage3.api_ecl_flag[i] == 1
        critical.push HitType.Hit
      else
        critical.push HitType.Miss
      enemyShip[i - 1].nowHP -= damage
      list.push new Attack AttackType.Normal, null, enemyShip[i - 1], enemyShip[i - 1].maxHP, enemyShip[i - 1].nowHP, dmg, critical
  else if support.api_support_hourai?
    for damage, i in support.api_support_hourai.api_damage
      continue unless 1 <= i <= 6
      damage = Math.floor(damage)
      dmg = []
      dmg.push damage
      critical = []
      if support.api_support_hourai.api_cl_list[i] == 2
        critical.push HitType.Critical
      else if support.api_support_hourai.api_cl_list[i] == 1
        critical.push HitType.Hit
      else
        critical.push HitType.Miss
      enemyShip[i - 1].nowHP -= damage
      list.push new Attack AttackType.Normal, null, enemyShip[i - 1], enemyShip[i - 1].maxHP, enemyShip[i - 1].nowHP, dmg, critical
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

simulateTorpedoSalvo = (sortieShip, enemyShip, raigeki) ->
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
      if crt == 2
        critical.push HitType.Critical
      else if crt == 1
        critical.push HitType.Hit
      else
        critical.push HitType.Miss
    enemyShip[target - 1].nowHP -= damage
    list.push new Attack AttackType.Normal, sortieShip[i - 1], enemyShip[target - 1], enemyShip[target - 1].maxHP, enemyShip[target - 1].nowHP, dmg, critical
  # 雷撃ターゲット
  for target, i in raigeki.api_erai
    continue if target <= 0
    damage = Math.floor(raigeki.api_eydam[i])
    dmg = []
    dmg.push damage
    # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
    critical = []
    for crt, j in raigeki.api_ecl[i]
      if crt == 2
        critical.push HitType.Critical
      else if crt == 1
        critical.push HitType.Hit
      else
        critical.push HitType.Miss
    sortieShip[target - 1].nowHP -= damage
    useItem = checkRepairItem sortieShip[target - 1]
    list.push new Attack AttackType.Normal, enemyShip[i - 1], sortieShip[target - 1], sortieShip[target - 1].maxHP, sortieShip[target - 1].nowHP, dmg, critical, useItem
  # test log
  #console.log list
  list

simulateShelling = (sortieShip, enemyShip, hougeki, isNight) ->
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
      if crt == 2
        critical.push HitType.Critical
      else if crt == 1
        critical.push HitType.Hit
      else
        critical.push HitType.Miss
    target = hougeki.api_df_list[i][0] - 1
    attackType = 0
    if !isNight
      attackType = AttackTypeMap[hougeki.api_at_type[i]]
    else
      attackType = NightAttackTypeMap[hougeki.api_sp_list[i]]
    if target < 6
      # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル　命中(0ダメージ)も存在する？
      sortieShip[target].nowHP -= totalDamage
      useItem = checkRepairItem sortieShip[target]
      list.push new Attack attackType, enemyShip[damageFrom - 6], sortieShip[target], sortieShip[target].maxHP, sortieShip[target].nowHP, dmg, critical, useItem
    else
      # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル　命中(0ダメージ)も存在する？
      enemyShip[target - 6].nowHP -= totalDamage
      list.push new Attack attackType, sortieShip[damageFrom], enemyShip[target - 6], enemyShip[target - 6].maxHP, enemyShip[target - 6].nowHP, dmg, critical
  # test log
  #console.log list
  list

# req needs the api_data name
simulate = (req) ->
    isCombined = req.poi_is_combined
    isWater = !req.poi_is_carrier
    # Initialization of sortieShip
    sortieShip = []
    enemyShip = []
    combinedShip = []
    sortiePos = 0
    sortiePos = req.api_deck_id - 1 if !isCombined
    for i in [0..5]
      sortieShip.push new Ship ShipOwner.Ours, req.poi_sortie_fleet[i], i + 1, req.poi_sortie_equipment[i], req.api_nowhps[i + 1], req.api_maxhps[i + 1]
      enemyShip.push new Ship ShipOwner.Enemy, req.api_ship_ke[i + 1], i + 1, req.poi_combined_equipment[i], req.api_nowhps[i + 7], req.api_maxhps[i + 7]
      if isCombined
        combinedShip.push new Ship ShipOwner.Ours, req.poi_combined_fleet[i], i + 1, req.api_nowhps[i + 13], req.api_maxhps[i + 13]
    sortieProgress = []

    # Air battle
    tempList = []
    if req.api_kouku?
      if req.api_kouku.api_stage3?
        tempList = tempList.concat simulateAerialCombat sortieShip, enemyShip, req.api_kouku.api_stage3
      if req.api_kouku.api_stage3_combined?
        tempList = tempList.concat simulateAerialCombat combinedShip, enemyShip, req.api_kouku.api_stage3_combined
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.AerialCombat, tempList

    # Second air battle
    tempList = []
    if req.api_kouku2?
      if req.api_kouku2.api_stage3?
        tempList = tempList.concat simulateAerialCombat sortieShip, enemyShip, req.api_kouku2.api_stage3
      if req.api_kouku2.api_stage3_combined?
        tempList = tempList.concat simulateAerialCombat combinedShip, enemyShip, req.api_kouku2.api_stage3_combined
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.AerialCombat, tempList

    # Support battle
    tempList = []
    if req.api_support_info?
      tempList = tempList.concat simulateSupportFire enemyShip, req.api_support_info
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.Support, tempList

    # Opening battle
    tempList = []
    if req.api_opening_atack?
      if isCombined
        tempList = tempList.concat simulateTorpedoSalvo combinedShip, enemyShip, req.api_opening_atack
      else
        tempList = tempList.concat simulateTorpedoSalvo sortieShip, enemyShip, req.api_opening_atack
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.TorpedoSalvo, tempList

    # First hougeki battle
    tempList = []
    if req.api_hougeki1?
      if isCombined && !isWater
        tempList = tempList.concat simulateShelling combinedShip, enemyShip, req.api_hougeki1, false
      else
        tempList = tempList.concat simulateShelling sortieShip, enemyShip, req.api_hougeki1, false
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.Shelling, tempList

    # Combined fleet raigeki
    tempList = []
    if req.api_raigeki? && isCombined && !isWater
      tempList = tempList.concat simulateTorpedoSalvo combinedShip, enemyShip, req.api_raigeki
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.TorpedoSalvo, tempList

    # Second hougeki battle
    tempList = []
    if req.api_hougeki2?
      tempList = tempList.concat simulateShelling sortieShip, enemyShip, req.api_hougeki2, false
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.Shelling, tempList

    # Combined hougeki battle
    tempList = []
    if req.api_hougeki3?
      if isCombined && isWater
        tempList = tempList.concat simulateShelling combinedShip, enemyShip, req.api_hougeki3, false
      else
        tempList = tempList.concat simulateShelling sortieShip, enemyShip, req.api_hougeki3, false
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.Shelling, tempList

    # Raigeki battle
    tempList = []
    if req.api_raigeki?
      if isCombined
        if isWater
          tempList = tempList.concat simulateTorpedoSalvo combinedShip, enemyShip, req.api_raigeki
      else
        tempList = tempList.concat simulateTorpedoSalvo sortieShip, enemyShip, req.api_raigeki
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.TorpedoSalvo, tempList

    # Night battle
    tempList = []
    if req.api_hougeki?
      if isCombined
        tempList = tempList.concat simulateShelling combinedShip, enemyShip, req.api_hougeki, true
      else
        tempList = tempList.concat simulateShelling sortieShip, enemyShip, req.api_hougeki, true
    tempList = null if tempList.length == 0
    sortieProgress.push new Stage StageType.Shelling, tempList

    sortieProgress


module.exports = {
  simulate
}
