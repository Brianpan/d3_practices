D3Donut =
  'Actived': false
  'PlotDiv': null
  'chartSelector': null
  'chartDom': null
  'legendDom': null
  'initialize': (plotSelector, chartSelector, legendSelector, callback) ->
    if @PlotDiv != null
      return
    @PlotDiv = $(plotSelector)
    @chartSelector = chartSelector
    @chartDom = $('<svg id = ' + chartSelector + '></svg>')
    @legendDom = $('<div id = ' + legendSelector + '></div>')
    @PlotDiv.append @chartDom
    @PlotDiv.append @legendDom
    @Actived = true
    if callback
      callback.call()
    return
  'view': (list) ->
    chart = @d3
    chart.exit()
    chart.width(400).height(400).setData list
    # render graph
    chart.render '#' + @chartSelector
    return
  'd3':
    '_width': 600
    '_height': 600
    '_margins':
      'top': 0
      'right': 0
      'bottom': 0
      'left': 0
    '_svg': null
    '_gBody': null
    '_colors': d3.scaleOrdinal(d3.schemeCategory20)
    '_data': []
    '_catNames': []
    '_clickedData': null
    '_rotated_degree': 0.7854
    '_donut': null
    '_arc': null
    '_chartInnerR': 0
    '_chartOuterR': 0
    '_innerRadius': 0
    '_hoverRadius': 0
    '_circleRadius': 0
    '_dummyArc': null
    '_axisLinePositions': null
    '_rotated': 0
    'setData': (list) ->
      @_data = list
      @_catNames = list.map((d) ->
        d.cat
      )
      this
    'render': (chartSelector) ->
      if !@_svg
        @_svg = d3.select(chartSelector).attr('width', @_width).attr('height', @_height)
      @renderBody()
      this
    'renderBody': ->
      if !@_gBody
        @_gBody = @_svg.append('g').attr('class', 'body').attr('transform', 'translate(' + @xStart() + ',' + @yEnd() + ')')
      @renderDonut()
      @renderCenter()
      return
    'renderCenter': ->
      @_circleRadius = @_chartOuterR * 0.6
      @_donut.append('svg:circle').attr('class', 'circle').attr('r', @_circleRadius).attr 'fill', '#FFFFFF'
      # append level
      @_donut.append('text').attr('class', 'center-text level').attr('y', -@_chartOuterR * 0.16).attr('text-anchor', 'middle').attr('font-size', '24px').text ''
      @_donut.append('text').attr('class', 'center-text percentage').attr('y', @_chartOuterR * 0.16).attr('text-anchor', 'middle').attr('font-weight', 'bold').attr('font-size', '36px').text ''
      return
    'setCenterText': (d, i) ->
      donut = d3.select('.donut')
      # original data stored in data attr
      # preprocess before executing this function	
      donut.select('.level').text (donutD) ->
        d.cat
      donut.select('.percentage').text (donutD) ->
        d.val
      return
    'renderDonut': ->
      @_chartInnerR = @quadrantWidth() * 0.4 * 0.14
      @_chartOuterR = @quadrantWidth() * 0.4 * 0.85
      @_donut = @_gBody.append('g').attr('class', 'donut').attr('transform', 'translate(' + @_chartInnerR + @_chartOuterR + ',' + @_chartInnerR + @_chartOuterR + ')')
      @updateDonut()
      return
    'updateDonut': ->
      that = this
      @_innerRadius = @_chartOuterR * 0.5
      @_hoverRadius = @_chartOuterR * 1.08
      @_arc = d3.arc().innerRadius(@_innerRadius).outerRadius(->
        if d3.select(this).classed('clicked') then that._hoverRadius else that._chartOuterR
      )
      @_dummyArc = d3.arc().innerRadius(that._hoverRadius * 1.1).outerRadius(that._hoverRadius * 1.1)
      pie = d3.pie().sort(null).padAngle(0.03).value((d) ->
        d.val
      )
      pieData = pie(@_data)
      donut_paths = @_donut.selectAll('path').data(pieData)
      donut_paths.transition().duration(1000).attr 'd', @_arc
      #
      donut_paths.enter().append('path').attr('d', @_arc).attr('class', (d, i) ->
        threatLevel = i + 1
        'level' + threatLevel
      ).style('fill', (d, i) ->
        that._colors i
      ).style('stroke', '#FFFFFF').on('mouseover', (d, i) ->
        thisPath = d3.select(this)
        if !thisPath.classed('clicked')
          that.pathAnim d3.select(this), 1
        # call member function to set center text
        that.setCenterText d.data, i
        return
      ).on('mouseout', (d, i) ->
        if !d3.select(this).classed('clicked')
          that.pathAnim d3.select(this), 0
          if that._clickedData
            # call member function to set center text
            that.setCenterText that._clickedData, i
        return
      ).on 'click', (d, i) ->
        thisPath = d3.select(this)
        clicked = thisPath.classed('clicked')
        if clicked
          return
        that._donut.selectAll('path').classed 'clicked', false
        that.pathAnim thisPath, 1
        thisPath.classed 'clicked', true
        that._clickedData = d.data
        that._rotated = -((d.startAngle + d.endAngle) / 2 - (that._rotated_degree))
        that._arc.startAngle((d) ->
          d.startAngle + that._rotated
        ).endAngle (d) ->
          d.endAngle + that._rotated
        that._donut.selectAll('path').transition().duration(1000).attr 'd', that._arc
        # call member function to set center text
        that.setCenterText d.data, i
        that.renderLine d, i
        return
      donut_paths.exit().remove()
      return
    'renderLine': (d, i) ->
      color = @_colors(i)
      # note line
      if !@_axisLinePositions
        centroid = @_dummyArc.centroid(d)
        centroidCorrectionX = Math.cos(@_rotated) * centroid[0] - (Math.sin(@_rotated) * centroid[1])
        centroidCorrectionY = Math.sin(@_rotated) * centroid[0] + Math.cos(@_rotated) * centroid[1]
        @_axisLinePositions = [
          {
            'x': centroidCorrectionX
            'y': centroidCorrectionY
          }
          {
            'x': centroidCorrectionX + 10
            'y': centroidCorrectionY - 10
          }
          {
            'x': centroidCorrectionX + 20
            'y': centroidCorrectionY - 10
          }
        ]
        line = d3.line().x((d) ->
          d.x
        ).y((d) ->
          d.y
        ).curve(d3.curveLinear)
        @_axisLine = @_gBody.append('path').attr('class', 'line').attr('d', line(@_axisLinePositions)).attr('transform', 'translate(' + @_chartInnerR + @_chartOuterR + ',' + @_chartInnerR + @_chartOuterR + ')')
        @_axisLine.style('stroke-width', 2).style 'fill', '#FFFFFF'
      @_axisLine.style 'stroke', color
      return
    'pathAnim': (path, boolFlag) ->
      that = this
      switch boolFlag
        when 0
          path.transition().duration(500).attr 'd', d3.arc().startAngle((d) ->
            d.startAngle + that._rotated
          ).endAngle((d) ->
            d.endAngle + that._rotated
          ).innerRadius(that._innerRadius).outerRadius(that._chartOuterR)
        when 1
          # make paths become normal except the one with boolFlag 1
          d3.select('.donut').selectAll('path:not(.clicked)').attr 'd', d3.arc().startAngle((d) ->
            d.startAngle + that._rotated
          ).endAngle((d) ->
            d.endAngle + that._rotated
          ).innerRadius(that._innerRadius).outerRadius(that._chartOuterR)
          path.transition().duration(500).attr 'd', d3.arc().startAngle((d) ->
            d.startAngle + that._rotated
          ).endAngle((d) ->
            d.endAngle + that._rotated
          ).innerRadius(that._innerRadius).outerRadius(that._hoverRadius)
      return
    'exit': ->
      if @_svg
        @_data = []
        @_svg.selectAll('*').remove()
        @_gBody = null
        @_svg = null
      return
    'width': (w) ->
      if !arguments.length
        return @_width
      @_width = w
      this
    'height': (h) ->
      if !arguments.length
        return @_height
      @_height = h
      this
    'quadrantWidth': ->
      @_width - (@_margins.left) - (@_margins.right)
    'quadrantHeight': ->
      @_height - (@_margins.top) - (@_margins.bottom)
    'xStart': ->
      @_margins.left
    'xEnd': ->
      @_width - (@_margins.right)
    'yStart': ->
      @_height - (@_margins.bottom)
    'yEnd': ->
      @_margins.top

# ---
# generated by js2coffee 2.2.0