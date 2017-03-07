D3Donut = {
	// variables
	"Actived": false,
	"PlotDiv": null,
	"chartSelector": null,
	"chartDom": null,
	"legendDom": null,
	"initialize": function(plotSelector, chartSelector, legendSelector, callback){
		if(this.PlotDiv !== null){return;}
		
		this.PlotDiv = $(plotSelector);
		this.chartSelector = chartSelector;
		
		this.chartDom = $("<svg id = "+ chartSelector +"></svg>"),
		this.legendDom = $("<div id = "+ legendSelector+"></div>");
		
		this.PlotDiv.append(this.chartDom);
		this.PlotDiv.append(this.legendDom);
		
		this.Actived = true;

		if(callback){
			callback.call();
		}
	},
	"view": function(list){
		var chart = this.d3;
		chart.exit();

		chart.width(400)
			 .height(400)
			 .setData(list);

		// render graph
		chart.render("#"+ this.chartSelector);
	},
	// plot graph
	"d3": {
		"_width": 600,
		"_height": 600,
		"_margins": {"top": 0, "right": 0, "bottom": 0, "left": 0},
		"_svg": null,
		"_gBody": null,
		"_colors": d3.scaleOrdinal(d3.schemeCategory20),
		"_data": [],
		"_catNames": [],
		"_clickedData": null,
		// rotated basis is pi/4
		"_rotated_degree": 0.7854,
		// donut chart settings
		"_donut": null,
		"_arc": null,
		"_chartInnerR": 0,
		"_chartOuterR": 0,
		"_innerRadius": 0,
		"_hoverRadius": 0,
		"_circleRadius": 0,
		"_dummyArc": null,
		"_axisLinePositions": null,
		"_rotated": 0,

		"setData": function(list){
			this._data = list;
			this._catNames = list.map(function(d){ return d.cat });
			
			return this;
		},
		"render": function(chartSelector){
			if( !this._svg ){
				this._svg = d3.select(chartSelector)
							  .attr("width", this._width)
							  .attr("height", this._height);
			}
			this.renderBody();
			return this;
		},
		"renderBody": function(){
			if( !this._gBody ){
				this._gBody = this._svg.append("g")
									   .attr("class", "body")
									   .attr("transform", "translate(" +
									   					this.xStart() + "," + this.yEnd() + ")");
			}
			this.renderDonut();
			this.renderCenter();
		},
		"renderCenter": function(){
			this._circleRadius = this._chartOuterR * 0.6;
			this._donut.append("svg:circle")
					   .attr("class", "circle")
					   .attr("r", this._circleRadius)
					   .attr("fill", "#FFFFFF");

			// append level
			this._donut.append("text")
					   .attr("class", "center-text level")
					   	.attr("y", -this._chartOuterR*0.16)
					   	.attr("text-anchor", "middle")
					   .attr("font-size", "24px")
					   .text("");
					   
			this._donut.append("text")
					   .attr("class", "center-text percentage")
					   .attr("y", this._chartOuterR*0.16)
					   .attr("text-anchor", "middle")
					   .attr("font-weight", "bold")
					   .attr("font-size", "36px")
					   .text("");
		},
		"setCenterText": function(d, i){
			var donut = d3.select(".donut");
			// original data stored in data attr
			// preprocess before executing this function	
		   donut.select(".level").text(function(donutD){
				return d.cat;
		   });

		   donut.select(".percentage").text(function(donutD){
				return d.val;
		   });	
		},
		// main donut drawing
		"renderDonut": function(){
			this._chartInnerR = this.quadrantWidth()*0.4*0.14,
			this._chartOuterR = this.quadrantWidth()*0.4*0.85;
			
			this._donut = this._gBody.append("g")
						 	  .attr("class", "donut")
							  .attr("transform", "translate(" + (this._chartInnerR+this._chartOuterR) 
                								+ "," + (this._chartInnerR+this._chartOuterR) + ")");
            this.updateDonut();                			
		},
		// main part for create donut
		"updateDonut": function(){
			var that = this;
			this._innerRadius = this._chartOuterR*0.5;
			this._hoverRadius = this._chartOuterR*1.08;

			this._arc = d3.arc()
						.innerRadius(this._innerRadius)
						.outerRadius(function(){
							return (d3.select(this).classed("clicked") ? that._hoverRadius : that._chartOuterR);
						});
			this._dummyArc = d3.arc()
							 .innerRadius(that._hoverRadius*1.1)
							 .outerRadius(that._hoverRadius*1.1);

			var pie = d3.pie()
					    .sort(null)
					    .padAngle(0.03)
					    .value(function(d){
					   	    return d.val;	
					    });
			var pieData = pie(this._data);
			var donut_paths = this._donut
							      .selectAll("path")
							      .data(pieData);
			donut_paths
                .transition()
                .duration(1000)
                .attr('d', this._arc);
            //

			donut_paths.enter()
					   .append("path")
					       .attr("d", this._arc)
					       .attr("class", function(d,i){
					       	   var threatLevel = i + 1;	
					       	   return "level" + threatLevel;   		
					       })
					       .style("fill", function(d, i){
					           return that._colors(i);	
					       })
					       .style("stroke", "#FFFFFF")
					       .on("mouseover", function(d, i){
					       	   var thisPath = d3.select(this);
					       	   if( !thisPath.classed("clicked") ){
						           that.pathAnim(d3.select(this), 1);
					       	   }
							   // call member function to set center text
							   that.setCenterText(d.data, i);
					       })
					       .on("mouseout", function(d, i){
					          if( !d3.select(this).classed("clicked") ){
					          	that.pathAnim(d3.select(this), 0);
								if( that._clickedData ){								    
								    // call member function to set center text
							   		that.setCenterText(that._clickedData, i);	
								}	          	
					          }	
					       })
					       .on("click", function(d, i){
					          var thisPath = d3.select(this);
					          var clicked = thisPath.classed("clicked");
					          if(clicked) return;

					          that._donut.selectAll("path").classed("clicked", false);
					          that.pathAnim(thisPath, 1);
					          thisPath.classed("clicked", true);
					          that._clickedData = d.data;

					          that._rotated = -( (d.startAngle + d.endAngle )/2 - that._rotated_degree );
		                      that._arc.startAngle(function(d) { return d.startAngle + that._rotated; })
		                         .endAngle(function(d) { return d.endAngle + that._rotated; });
		                      
		                      that._donut.selectAll("path").transition()
		                               .duration(1000)
		                               .attr('d', that._arc);

		                      // call member function to set center text
							  that.setCenterText(d.data, i);   
		                      that.renderLine(d, i);
							});

			donut_paths.exit().remove();	   
		},
		"renderLine": function(d, i){
			var color = this._colors(i);
			// note line
			if(!this._axisLinePositions){
				var centroid = this._dummyArc.centroid(d),
					centroidCorrectionX = Math.cos(this._rotated)*centroid[0] - Math.sin(this._rotated)*centroid[1],
					centroidCorrectionY = Math.sin(this._rotated)*centroid[0] + Math.cos(this._rotated)*centroid[1];
				this._axisLinePositions = [{"x": centroidCorrectionX, "y": centroidCorrectionY},
										   {"x": centroidCorrectionX+10, "y": centroidCorrectionY - 10},
										   {"x": centroidCorrectionX+20, "y": centroidCorrectionY - 10}];
				var line = d3.line()
							 .x(function(d){
							 	return d.x;
							 })
							 .y(function(d){
							 	return d.y;
							 })
							 .curve(d3.curveLinear);
				this._axisLine = this._gBody.append("path")
											.attr("class", "line")
											.attr("d", line(this._axisLinePositions))
								     	    .attr("transform", "translate(" + (this._chartInnerR+this._chartOuterR) 
                								+ "," + (this._chartInnerR+this._chartOuterR) + ")");
				this._axisLine.style("stroke-width", 2)
							  .style("fill", "#FFFFFF");
			}
			
			this._axisLine.style('stroke', color);
		},
		"pathAnim": function(path, boolFlag){
			var that = this;
			switch(boolFlag){
				case 0:
					path.transition()
						.duration(500)
						.attr("d", d3.arc()
									 .startAngle(function(d){
									 	return d.startAngle + that._rotated;
									 })
									 .endAngle(function(d){
									 	return d.endAngle + that._rotated;
									 })
									 .innerRadius(that._innerRadius)
									 .outerRadius(that._chartOuterR));
					break;
				case 1:
					// make paths become normal except the one with boolFlag 1
					d3.select(".donut")
					  .selectAll("path:not(.clicked)")
					  .attr("d", d3.arc()
					  				.startAngle(function(d){
									 	return d.startAngle + that._rotated;
									 })
									 .endAngle(function(d){
									 	return d.endAngle + that._rotated;
									 })
									 .innerRadius(that._innerRadius)
									 .outerRadius(that._chartOuterR));

					path.transition()
						.duration(500)
						.attr("d", d3.arc()
									 .startAngle(function(d){
									 	return d.startAngle + that._rotated;
									 })
									 .endAngle(function(d){
									 	return d.endAngle + that._rotated;
									 })
									 .innerRadius(that._innerRadius)
									 .outerRadius(that._hoverRadius));
			}
		},
		//
		"exit": function(){
			if(this._svg){
				this._data = [];
				this._svg.selectAll("*").remove();
				this._gBody = null,
				this._svg = null;
			}
		},
		// chart size settings
		"width": function(w){
			if(!arguments.length) return this._width;
			this._width = w;
			return this;
		},
		"height": function(h){
			if(!arguments.length) return this._height;
			this._height = h;
			return this;
		},
		"quadrantWidth": function(){
			return ( this._width - this._margins.left - this._margins.right );
		},
		"quadrantHeight": function(){
			return ( this._height - this._margins.top - this._margins.bottom );
		},
		// calculate exactly positions of 4 corners
		"xStart": function(){
			return this._margins.left;
		},
		"xEnd": function(){
			return ( this._width - this._margins.right );
		},
		"yStart": function(){
			return ( this._height - this._margins.bottom );
		},
		"yEnd": function(){
			return ( this._margins.top );
		}
	}
}