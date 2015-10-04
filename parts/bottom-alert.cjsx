{Alert} = ReactBootstrap
module.exports = React.createClass
  render: ->
    <div>
      {
        if @props.getShip?
          <Alert>
            {"#{@props.getShip.api_ship_type} 「#{@props.getShip.api_ship_name}」 #{@props.joinFleet}"}
          </Alert>
        else if @props.formationNum != 0
          <Alert>
            {"#{@props.result} | #{@props.formation} | #{@props.intercept} | #{@props.seiku}"}
          </Alert>
        else if @props.nextSpotInfo
          <Alert>
            {"#{@props.compassPoint}: "}
            {
              if @props.compassAngle
                # FontAwesome `location-arrow` points to north by east 45 degrees.
                <FontAwesome name='location-arrow' fixedWidth={true}
                             style={transform: "rotate(#{@props.compassAngle - 45}deg)", width: "2rem"} />
              else
                "?"
            }
            {" | #{@props.nextSpot}: #{@props.nextSpotInfo}"}
          </Alert>
      }
    </div>
