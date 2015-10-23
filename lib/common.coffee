## Discuss
# * All capital in enum name
#   In common, we should use all cappital in naming enum type,
#   but it has low readability.


## class Ship
class Ship
  constructor: (@owner, @id, @position, @equipment, @nowHP, @maxHP) ->
    # owner = enum ShipOwner
    # id = int : api_id of api_start2.api_mst_ship
    # position = int : Position of ship in fleet
    # equipment = [int, ...] : api_id of api_start2.api_mst_slotitem
    # nowHP = int
    # maxHP = int

# enum ShipOwner
ShipOwner =
  Ours: "ShipOwner.Ours"
  Enemy: "ShipOwner.Enemy"


## class Attack
class Attack
  constructor: (@type, @fromShip, @toShip,
                @maxHP, @nowHP, @damage, @hit, @useItem = NaN) ->
    # type = enum AttackType
    # fromShip = class Ship
    # toShip = class Ship
    # maxHP = int : property of `@toShip`
    # nowHP = int : ^
    # damage = [int, ...]
    # hit = [enum HitType, ...]
    # useItem = int : api_id of api_start2.api_mst_slotitem
    #           NaN : if didnt used any item
    # Assert: @damage.length == @hit.length

# enum AttackType
# Day:   api_req_sortie/battle .api_hougeki[1-3].api_at_type
# Night: api_req_battle_midnight/battle .api_hougeki.api_sp_list
AttackType =
  Normal: 0               # 通常攻撃, @damage.length == 1
  Laser: 1                # レーザー攻撃, @damage.length == ?
  Double: 2               # 連撃, @damage.length == 2
  Primary_Secondary_CI: 3 # カットイン(主砲/副砲), @damage.length == 1
  Primary_Radar_CI: 4     # カットイン(主砲/電探), @damage.length == 1
  Primary_AP_CI: 5        # カットイン(主砲/徹甲), @damage.length == 1
  Primary_Primary_CI: 6   # カットイン(主砲/主砲), @damage.length == 1
  Primary_Torpedo_CI: 7   # カットイン(主砲/魚雷), @damage.length == 2
  Torpedo_Torpedo_CI: 8   # カットイン(魚雷/魚雷), @damage.length == 2

# enum HitType
HitType =
  Miss: 0
  Hit: 1
  Critical: 2


## class Stage
class Stage
  constructor: (@type, @detail) ->
    # type = enum StageType
    # detail = list of class Attack

# enum StageType
StageType =
  AerialCombat: "AerialCombat",
  TorpedoSalvo: "TorpedoSalvo",
  Shelling: "Shelling",
  Support: "Support"


## CommonJS exports
module.exports = {
  Ship, ShipOwner
  Attack, AttackType, HitType
  Stage, StageType
}
