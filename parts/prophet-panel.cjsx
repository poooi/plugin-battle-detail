{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
NavigationBar = require './navigation-bar'
ProphetContent = require './prophet-content'
module.exports = React.createClass
  render: ->
    <div>
      <NavigationBar
        HP={@props.HP}
        sortieFleet={@props.sortieFleet}
        enemyName={@props.enemyName}
        sortiePlane={@props.sortiePlane}
        enemyPlane={@props.enemyPlane}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        enemyInfo={@props.enemyInfo}
        isFirst={1} />
      <ProphetContent
        sortieHp={@props.sortieHp}
        enemyHp={@props.enemyHp}
        combinedHp={@props.combinedHp}
        sortieInfo={@props.sortieInfo}
        enemyInfo={@props.enemyInfo}
        combinedInfo={@props.combinedInfo}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        isFirst={1}
        goBack={@props.goBack}
        compactMode={@props.compactMode}
        mvpPos = {@props.mvpPos}/>
      <NavigationBar
        HP={@props.HP}
        sortieFleet={@props.sortieFleet}
        enemyName={@props.enemyName}
        sortiePlane={@props.sortiePlane}
        enemyPlane={@props.enemyPlane}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        enemyInfo={@props.enemyInfo}
        isFirst={0} />
      <ProphetContent
        sortieHp={@props.sortieHp}
        enemyHp={@props.enemyHp}
        combinedHp={@props.combinedHp}
        sortieInfo={@props.sortieInfo}
        enemyInfo={@props.enemyInfo}
        combinedInfo={@props.combinedInfo}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        isFirst={0}
        goBack={@props.goBack}
        compactMode={@props.compactMode}
        mvpPos={@props.mvpPos}/>
    </div>
