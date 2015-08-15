{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
module.exports = React.createClass
  render: ->
    if @props.isFirst == 1 || (@props.isFirst == 0 && @props.lay == 0)
      if @props.isFirst == 1
        <Alert>
          <Grid>
            {
              for i in [0..(@props.cols)]
                if i == 2
                  <Col xs={12}>
                    <Col xs={6}>{@props.enemyName}</Col>
                    <Col xs={6}>{@props.HP}</Col>
                  </Col>
                else
                  <Col xs={12}>
                    <Col xs={6}>{@props.sortieFleet}</Col>
                    <Col xs={6}>{@props.HP}</Col>
                  </Col>
            }
          </Grid>
        </Alert>
      else
        <Alert>
          <Grid>
            <Col xs={12}>
              <Col xs={6}>{@props.enemyName}</Col>
              <Col xs={6}>{@props.HP}</Col>
            </Col>
          </Grid>
        </Alert>
    else
      <div>""</div>
