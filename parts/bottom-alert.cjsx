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
        else if @props.cellInfo isnt ''
          <Alert>
            {"#{@props.admiral} #{@props.nextCell} :「#{@props.cellInfo}」"}
          </Alert>
          
      }
    </div>
