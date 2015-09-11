{Table, ProgressBar, Grid, Input, Col, Alert, Button, OverlayTrigger, Popover} = ReactBootstrap

getCondStyle = (cond, show) ->
  if show
    window.getCondStyle cond

module.exports = React.createClass
  render: ->
    if @props.lv == -1
      <td>　</td>
    else
      <td style={opacity: 1 - 0.6 * @props.isBack} className="prophet-info-content">
        {
          nameTxt = "#{@props.name}"
          lvTxt = " - Lv.#{@props.lv}"
          condTxt = " ★#{@props.cond}"
          showCond = @props.condShow

          txt = nameTxt
          popoverTxt = nameTxt + lvTxt
          if !@props.compactMode
            txt += lvTxt
          if showCond
            txt += condTxt
            popoverTxt += condTxt

          <OverlayTrigger trigger='click' rootClose placement='bottom' overlay={<Popover>{popoverTxt}</Popover>}>
            <span className={getCondStyle(@props.cond, showCond)}>{txt}</span>
          </OverlayTrigger>
        }
      </td>
