{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap

getCondStyle = (cond) ->
  if window.theme.indexOf('dark') != -1 or window.theme == 'slate' or window.theme == 'superhero'
    if cond > 52
      color: '#FFFF00',
      fontWeight: 'bold',
      textShadow: '0 0 7px #FFFF00'
    else if cond > 49
      color: '#FFFF80'
    else if cond is 49
      {}
    else if cond < 48
      opacity: 0.5
    else if cond < 40
      color: '#FFC880'
    else if cond < 30
      color: '#F37B1D'
    else # if cond < 20
      color: '#DD514C'
  else
    if cond > 52
      textShadow: '0 0 3px #FFFF00'
    else if cond > 49
      textShadow: '0 0 3px #FFFF80'
    else if cond < 20
      textShadow: '0 0 3px #DD514C'
    else if cond < 30
      textShadow: '0 0 3px #F37B1D'
    else if cond < 40
      textShadow: '0 0 3px #FFC880'
    else
      null

module.exports = React.createClass
  render: ->
    if @props.lv == -1
      <td>　</td>
    else
      <td style={opacity: 1 - 0.6 * @props.isBack}>
        {
          txt = "#{@props.name}(#{@props.lv})"
          title = "#{@props.name}(Lv.#{@props.lv})"
          if @props.cond && @props.condShow != 0
            title += " Cond.#{@props.cond}"
            <span style={getCondStyle @props.cond} title={title}>
              {txt}<FontAwesome key={1} name='star' />{@props.cond}
            </span>
          else
            <span title={title}>{txt}</span>
        }
      </td>
