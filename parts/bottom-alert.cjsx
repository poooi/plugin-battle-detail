{Alert} = ReactBootstrap
module.exports = React.createClass
  render: ->
    <div>
      {
        if @props.getShip?
          <Alert>
            {"#{@props.admiral} #{@props.getShip.api_ship_type} 「#{@props.getShip.api_ship_name}」 #{@props.joinFleet}"}
          </Alert>
        else if @props.formationNum != 0
          <Alert>
            {"#{@props.admiral} 「#{@props.formation}」「#{@props.intercept}」「#{@props.seiku}」「#{@props.result}」"}
          </Alert>
      }
    </div>
