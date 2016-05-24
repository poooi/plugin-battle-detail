# Poi Battle Packet Standard V2.0

```
{
    'version': '2.0',
    'map': [2, 3, 1] || null,  # Sortied map no, or `null`.
    'time': 1445252829039,     # Seconds since epoch time. Must be same as the first packet.
    'desc': 'Sortie',          # Description of the battle.
    'fleet': {
        'main': {
            'api_*': *,  # Copy from api_port/port.api_ship[id]
            'poi_slot_ex': {
                'api_*': *,  # Copy from api_get_member/slot_item[id]
            }
            'poi_slot': [
                {
                    # = poi_slot_ex
                },
                # ... or `null`
            ]
        },
        'escort': {
            # ...
        },
        'support': {
            # ...
        },
        'LBAC': {
            # Copy from api_get_member/base_air_corps
        }
    },
    'packet': [
        {
            'api_*': *,  # Copy from api_req_sortie/battle or ...
            'poi_path': '/kcsapi/api_req_sortie/battle',  # API path
            'poi_time': 1445252829039,
        },
    ],
}
```
