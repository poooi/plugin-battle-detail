{Alert} = ReactBootstrap
module.exports = React.createClass
  render: ->
    <Alert>
      {
        console.log @props
        if @props.getShip?
          "#{@props.admiral} #{@props.getShip.api_ship_type} 「#{@props.getShip.api_ship_name}」 #{@props.joinFleet}"
        else
          "#{@props.admiral} 「#{@props.formation}」「#{@props.intercept}」「#{@props.result}」"
      }
    </Alert>
