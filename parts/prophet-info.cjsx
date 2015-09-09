{Table, ProgressBar, Grid, Input, Col, Alert, Button, OverlayTrigger, Popover} = ReactBootstrap

getCondStyle = (cond) ->
getCondStyle = (cond, show) ->
  if !show
    {}
  else if window.theme.indexOf('dark') != -1 or window.theme == 'slate' or window.theme == 'superhero'
    if cond > 52 # 53~100
      color: '#FFFF00',
      fontWeight: 'bold',
      textShadow: '0 0 7px #FFFF00'
    else if cond > 49 # 50~52
      color: '#FFFF80'
    else if cond is 49 # 49
      {}
    else if cond < 20 # 0~19
      color: '#DD514C'
    else if cond < 30 # 20~29
      color: '#F37B1D'
    else if cond < 40 # 30~39
      color: '#FFC880'
    else # 40~48
      color: '#FFE8CB'
      opacity: 0.8
  else
    if cond > 52
      textShadow: '0 0 3px #FFFF00'
    else if cond > 49
      textShadow: '0 0 3px #FFFF80'
    else if cond is 49
      {}
    else if cond < 20
      textShadow: '0 0 3px #DD514C'
    else if cond < 30
      textShadow: '0 0 3px #F37B1D'
    else if cond < 40
      textShadow: '0 0 3px #FFC880'
    else
      textShadow: '0 0 3px #FFE8CB'

module.exports = React.createClass
  render: ->
    if @props.lv == -1
      <td>　</td>
    else
      <td style={opacity: 1 - 0.6 * @props.isBack} className="prophet-info-content">
        {
          nameTxt = "#{@props.name}"
          lvTxt = " Lv.#{@props.lv}"
          condTxt = " ★#{@props.cond}"
          showCond = @props.condShow

          txt = nameTxt
          popoverTxt = nameTxt + lvTxt
          if showCond
            txt += condTxt
            popoverTxt += condTxt
          if !@props.compactMode
            txt += lvTxt

          <OverlayTrigger trigger='click' rootClose placement='bottom' overlay={<Popover>{popoverTxt}</Popover>}>
            <span style={getCondStyle(@props.cond, showCond)}>{txt}</span>
          </OverlayTrigger>
        }
      </td>
