{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
module.exports = React.createClass
  render: ->
    if @props.isFirst == 1 || (@props.isFirst == 0 && @props.lay == 0)
      if @props.isFirst == 1
        <Alert>
          {
            list = []
            tmp = 6 / (@props.cols + 1)
            for i in [0..(@props.cols)]
              if (i == @props.cols) && (@props.lay == 1)
                if !@props.enemyPlane
                  list.push <Col xs={tmp}>{@props.enemyName}</Col>
                else
                  list.push <Col xs={tmp} className="navigation-bar-airplane">「<FontAwesome name='plane' />{@props.enemyPlane}」{@props.enemyName}</Col>
              else if i == 1 or !@props.sortiePlane
                list.push <Col xs={tmp}>{@props.sortieFleet}</Col>
              else
                list.push <Col xs={tmp} className="navigation-bar-airplane">「<FontAwesome name='plane' />{@props.sortiePlane}」{@props.sortieFleet}</Col>
              list.push <Col xs={tmp}>{@props.HP}</Col>
            <Grid>
              {list}
            </Grid>
          }
        </Alert>
      else if @props.enemyInfo.lv[0] != -1
        <Alert>
          <Grid>
            <Col xs={12}>
              <Col xs={6} className="navigation-bar-airplane">
                {
                  if @props.enemyPlane
                    <span>「<FontAwesome name='plane' />{@props.enemyPlane}」</span>
                }
                {@props.enemyName}
              </Col>
              <Col xs={6}>{@props.HP}</Col>
            </Col>
          </Grid>
        </Alert>
      else
        <div></div>
    else
      <div></div>
