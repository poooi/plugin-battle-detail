# Poi Battle Packet Standard V2.0

A battle packet is a JSON file with structure:

```
Battle = {
  'version': '2.0',
  'map':  [2, 3, 1],      # Sortied map no. Allow null.
  'time': 1445252829039,  # Seconds since epoch time. Must be same as the first packet.
  'desc': 'Sortie',       # Description of the battle.
  'fleet': {
    'main':    Fleet,     # Allow null.
    'escort':  Fleet,
    'support': Fleet,
    'LBAC': [LandBaseAirCrops, ...]   # Contain sortied crops only.
  },
  'packet': [Packet, ...]
}

Fleet = {
  'api_*': *,  # Copy from api_port/port.api_ship[id]
  'poi_slot': [Item, ...],
  'poi_slot_ex': Item,
}

LandBaseAirCrops = {
  'api_*': *,   # Copy from `api_get_member/base_air_corps`
}

Item = {
  'api_*': *,   # Copy from `api_get_member/slot_item[id]`
}

Packet = {
  'api_*': *,   # Copy from `api_req_sortie/battle` or ...
  'poi_path': '/kcsapi/api_req_sortie/battle',  # API path
  'poi_time': 1445252829039,
}
```
