# Alert: post the battle detail to call the function and, add attribute:
#         isCombined: is combined fleet
#         isWater: is combined surface water fleet
#         sortieID: the list of the id in _ships for the sortie fleet
#         combinedID: the list of the id in _ships for the combined fleet
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
# 1       1     連撃
# 2       7     カットイン(主砲/魚雷)
# 3       8     カットイン(魚雷/魚雷)
# 4       3     カットイン(主砲/副砲)
# 5       6     カットイン(主砲/主砲)
checkNightAttackType = [
  0,
  1,
  7,
  8,
  3,
  6
]

koukuAttack = (sortieShip, enemyShip, kouku) ->
  list = []
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      dmg = []
      dmg.push damage
      list.push new Attack AttackType[checkAttackType[0]], null, enemyShip[i - 1], enemyShip[i - 1].hp[1], enemyShip[i - 1].hp[0], dmg, kouku.api_fcl_flag[i] == 1
      enemyShip[i - 1].hp[0] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      dmg = []
      dmg.push damage
      list.push new Attack AttackType[checkAttackType[0]], null, sortieShip[i - 1], sortieShip[i - 1].hp[1], sortieShip[i - 1].hp[0], dmg, kouku.api_ecl_flag[i] == 1
      sortieShip[i - 1].hp[0] -= damage
  # test log
  #console.log list
  list

#supportAttack = (enemyShip, support) ->
#  for damage, i in support
#    damage = Math.floor(damage)
#    continue if damage <= 0
#    continue if i > 6
#    enemyShip.dmg[i - 1] += damage
#    enemyShip[i - 1].now -= damage
#api_opening_atack	：開幕雷撃戦 *スペルミスあり、注意
#		api_frai		：雷撃ターゲット
#		api_erai		：
#		api_fdam		：被ダメージ
#		api_edam		：
#		api_fydam		：与ダメージ
#		api_eydam		：
#		api_fcl			：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
#		api_ecl			：攻撃側に記述される

raigekiAttack = (sortieShip, enemyShip, raigeki) ->
  list = []
  # 雷撃ターゲット
  for target, i in raigeki.api_frai
    continue if target <= 0
    damage = Math.floor(raigeki.api_fydam[i])
    dmg = []
    dmg.push damage
    # クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
    list.push new Attack AttackType[checkAttackType[0]], sortieShip[i - 1], enemyShip[target - 1], enemyShip[target - 1].hp[1], enemyShip[target - 1].hp[0], dmg, raigeki.api_fcl[i] == 2
    enemyShip[i - 1].hp[0] -= damage
  # 雷撃ターゲット
  for target, i in raigeki.api_erai
    continue if target <= 0
    damage = Math.floor(raigeki.api_eydam[i])
    dmg = []
    dmg.push damage
    # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル
    list.push new Attack AttackType[checkAttackType[0]], enemyShip[i - 1], sortieShip[target - 1], sortieShip[target - 1].hp[1], sortieShip[target - 1].hp[0], dmg, raigeki.api_ecl[i] == 2
    sortieShip[i - 1].hp[0] -= damage
  # test log
  #console.log list
  list

hougekiAttack = (sortieShip, enemyShip, hougeki, isNight) ->
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
    target = hougeki.api_df_list[i][0] - 1
    attackType = 0
    if !isNight
      attackType = hougeki.api_at_type[i]
    else
      attackType = checkNightAttackType[hougeki.api_sp_list[i]]
    if target < 6
      sortieShip[target].hp[0] -= totalDamage
      # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル　命中(0ダメージ)も存在する？
      list.push new Attack AttackType[checkAttackType[attackType]], enemyShip[damageFrom - 6], sortieShip[target], sortieShip[target].hp[1], sortieShip[target].hp[0], dmg, hougeki.api_cl_list[i] == 2
    else
      enemyShip[target - 6].hp[0] -= totalDamage
      # api_cl_list		：クリティカルフラグ 0=ミス, 1=命中, 2=クリティカル　命中(0ダメージ)も存在する？
      list.push new Attack AttackType[checkAttackType[attackType]], sortieShip[damageFrom], enemyShip[target - 6], enemyShip[target - 6].hp[1], enemyShip[target - 6].hp[0], dmg, hougeki.api_cl_list[i] == 2
  # test log
  #console.log list
  list

# req needs the api_data name
module.exports =
  simulate: (req) ->
    # Initialization of sortieShip
    sortieShip = []
    enemyShip = []
    combinedShip = []
    sortiePos = 0
    sortiePos = req.api_deck_id - 1 if !req.isCombined
    for i in [0..5]
      sortieShip.push new Ship ShipOwner.Ours, req.sortieID[i], [req.api_nowhps[i + 1], req.api_maxhps[i + 1]]
      enemyShip.push new Ship ShipOwner.Enemy, req.api_ship_ke[i + 1], [req.api_nowhps[i + 7], req.api_maxhps[i + 7]]
      if req.isCombined
        combinedShip.push new Ship ShipOwner.Friends, req.combinedID[i], [req.api_nowhps[i + 13], req.api_maxhps[i + 13]]
    sortieProgress = []

    # Air battle
    if req.api_kouku?
      if req.api_kouku.api_stage3?
        sortieProgress.push new Stage StageType.Kouku, koukuAttack sortieShip, enemyShip, req.api_kouku.api_stage3
      if req.api_kouku.api_stage3_combined?
        sortieProgress.push new Stage StageType.Kouku, koukuAttack combinedShip, enemyShip, req.api_kouku.api_stage3_combined

    # Second air battle
    if req.api_kouku2?
      if req.api_kouku2.api_stage3?
        sortieProgress.push new Stage StageType.Kouku, koukuAttack sortieShip, enemyShip, req.api_kouku2.api_stage3
      if req.api_kouku2.api_stage3_combined?
        sortieProgress.push new Stage StageType.Kouku, koukuAttack combinedShip, enemyShip, req.api_kouku2.api_stage3_combined

    # Support battle
    #  if req.api_support_info?
    #    if req.api_support_info.api_support_airatack?
    #      sortieProgress.push supportAttack enemyShip, req.api_support_info.api_support_airatack.api_stage3.api_edam
    #    else if req.api_support_info.api_support_hourai?
    #      sortieProgress.push supportAttack enemyShip, req.api_support_info.api_support_hourai.api_damage
    #    else
    #      sortieProgress.push supportAttack enemyShip, req.api_support_info.api_damage

    # Opening battle
    if req.api_opening_atack?
      if req.isCombined
        sortieProgress.push new Stage StageType.Raigeki, raigekiAttack combinedShip, enemyShip, req.api_opening_atack
      else
        sortieProgress.push new Stage StageType.Raigeki, raigekiAttack sortieShip, enemyShip, req.api_opening_atack

    # First hougeki battle
    if req.api_hougeki1?
      if req.isCombined && !req.isWater
        sortieProgress.push new Stage StageType.Hougeki, hougekiAttack combinedShip, enemyShip, req.api_hougeki1, false
      else
        sortieProgress.push new Stage StageType.Hougeki, hougekiAttack sortieShip, enemyShip, req.api_hougeki1, false

    # Second hougeki battle
    if req.api_hougeki2?
      sortieProgress.push new Stage StageType.Hougeki, hougekiAttack sortieShip, enemyShip, req.api_hougeki2, false

    # Combined hougeki battle
    if req.api_hougeki3?
      if req.isCombined && req.isWater
        sortieProgress.push new Stage StageType.Hougeki, hougekiAttack combinedShip, enemyShip, req.api_hougeki3, false
      else
        sortieProgress.push new Stage StageType.Hougeki, hougekiAttack sortieShip, enemyShip, req.api_hougeki3, false

    # Raigeki battle
    if req.api_raigeki?
      if req.isCombined
        sortieProgress.push new Stage StageType.Raigeki, raigekiAttack combinedShip, enemyShip, req.api_raigeki
      else
        sortieProgress.push new Stage StageType.Raigeki, raigekiAttack sortieShip, enemyShip, req.api_raigeki

    # Night battle
    if req.api_hougeki?
      if req.isCombined
        sortieProgress.push new Stage StageType.Hougeki, hougekiAttack combinedShip, enemyShip, req.api_hougeki, true
      else
        sortieProgress.push new Stage StageType.Hougeki, hougekiAttack sortieShip, enemyShip, req.api_hougeki, true
    sortieProgress
