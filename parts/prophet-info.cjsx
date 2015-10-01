{Table, ProgressBar, Grid, Input, Col, Alert, Button, OverlayTrigger, Popover} = ReactBootstrap

getCondStyle = (cond, show) ->
  if show
    window.getCondStyle cond

module.exports = React.createClass
  render: ->
    if @props.lv == -1
      <td>　</td>
    else
      nameTxt = "#{@props.name} "
      showCond = @props.condShow
      if showCond
        condTxt = "★#{@props.cond} "
        nameTxt += condTxt
      lvTxt = "- Lv.#{@props.lv} "
      popoverTxt = nameTxt + lvTxt
      if !@props.compactMode
        nameTxt += lvTxt

      <td style={opacity: 1 - 0.6 * @props.isBack} className="prophet-info-content">
        <div className="ship-name">
          <OverlayTrigger trigger='click' rootClose placement='bottom' overlay={<Popover>{popoverTxt}</Popover>} >
            <span className={getCondStyle(@props.cond, showCond)}>
              <span className="prophet-info-name">{nameTxt}</span>
            </span>
          </OverlayTrigger>
        </div>
        <div className="attack-damage">
          {
            if @props.mvp == true
              <span className={getCondStyle(100, 1)}>{@props.atk}</span>
            else
              <span>{@props.atk}</span>
          }
        </div>
      </td>
