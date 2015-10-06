## Discuss
# * All capital in enum name
#   In common, we should use all cappital in naming enum type,
#   but camel-case is so beautiful.

## class Ship
class Ship
  constructor: (@owner, @id, @hp) ->
    # owner = enum ShipOwner
    # id = int
    #       : api_id of player owned ships (window._ships) OR
    #       : api_id of enemy ships (window.$ships)
    # hp[0] = now = the array of the fleet's now hp
    # hp[1] = max = the array of the fleet's max hp

# enum ShipOwner
ShipOwner =
  Ours: "ShipOwner.Ours"
  Enemy: "ShipOwner.Enemy"

## class Attack
# Use on Shelling, Torpedo Salvo
# Shouldn't use on Aerial Combat
class Attack
  constructor: (@type, @fromShip, @toShip,
                @maxHP, @nowHP, @damage, @isCritical) ->
    # type = enum AttackType
    # fromShip = class Ship
    # toShip = class Ship
    # maxHP = int : property of `@toShip`
    # nowHP = int : ^
    # damage = [int, ...] : Array
    # isCritical = [boolean, ...] : Array
    # Assert: @damage.length == @isCritical.length

# enum AttackType
# Day:   api_req_sortie/battle .api_hougeki[1-3].api_at_type
# Night: api_req_battle_midnight/battle .api_hougeki.api_sp_list
AttackType =
  # 通常攻撃, Day=0, Night=0, torpedo, @damage.length == 1
  Normal: 0
  # レーザー攻撃, Day=1, Night=x, laser, @damage.length == ?
  Laser: 1
  # 連撃, Day=2, Night=1, @damage.length == 2
  Double: 2
  # カットイン(主砲/副砲), Day=3, Night=4, @damage.length == 1
  Primary_Secondary_CI: 3
  # カットイン(主砲/電探), Day=4, Night=x, @damage.length == 1
  Primary_Radar_CI: 4
  # カットイン(主砲/徹甲), Day=5, Night=x, @damage.length == 1
  Primary_AP_CI: 5
  # カットイン(主砲/主砲), Day=6, Night=5, @damage.length == 1
  Primary_Primary_CI: 6
  # カットイン(主砲/魚雷), Day=x, Night=2, @damage.length == 2
  Primary_Torpedo_CI: 7
  # カットイン(魚雷/魚雷), Day=x, Night=3, @damage.length == 2
  Torpedo_Torpedo_CI: 8

## class Stage
class Stage
  constructor: (@name, @detail) ->
    # name = enum BattleType
    # detail = list of class Attack

# enum StageType
StageType =
  Kouku: "Kouku",
  Raigeki: "Raigeki",
  Hougeki: "Hougeki"


## CommonJS exports
module.exports =
  Ship: Ship
  ShipOwner: ShipOwner
  Attack: Attack
  AttackType: AttackType
  Stage: Stage
  StageType: StageType
