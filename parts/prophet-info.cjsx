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
          popoverTxt = nameTxt + lvTxt
          if !@props.compactMode
            nameTxt += lvTxt

          showCond = @props.condShow
          condTxt = ''
          if showCond
            condTxt = " ★#{@props.cond}"
            popoverTxt += condTxt

          <OverlayTrigger trigger='click' rootClose placement='bottom' overlay={<Popover>{popoverTxt}</Popover>}>
            <span className={getCondStyle(@props.cond, showCond)}>
              <span className="poi-prophet-non-cond">{nameTxt}</span>
              {condTxt}
            </span>
          </OverlayTrigger>
        }
      </td>
