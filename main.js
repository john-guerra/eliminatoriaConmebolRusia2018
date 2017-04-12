/*eslint browser: true, indent: 2 */
/* global d3: false, $: false, alert: false, bumpChartPhotos: false , FlickrUtils: true, console: true, utils: true */

//Main
"use strict";

var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// var svg = d3.select("body").append("svg")
//   .attr("width", width + margin.left + margin.right)
//   .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var myBumpChart,
  rounds,
  ranking;

function computeRanking(data) {
  var result = [];
  var dPoints = {};
  var dGoals = {};
  var dGoalsAgainst = {};
  var dGoalsVisitor = {};
  var dGoalsLocal = {};
  data.sort(function (a,b) { return d3.ascending(a.round, b.round); })
    .forEach(function (d) {
      if (!(d.teams[0] in dPoints)) { dPoints[d.teams[0]] = 0; }
      if (!(d.teams[1] in dPoints)) { dPoints[d.teams[1]] = 0; }
      if (!(d.teams[0] in dGoals)) { dGoals[d.teams[0]] = 0; }
      if (!(d.teams[1] in dGoals)) { dGoals[d.teams[1]] = 0; }
      if (!(d.teams[0] in dGoalsAgainst)) { dGoalsAgainst[d.teams[0]] = 0; }
      if (!(d.teams[1] in dGoalsAgainst)) { dGoalsAgainst[d.teams[1]] = 0; }
      if (!(d.teams[0] in dGoalsLocal)) { dGoalsLocal[d.teams[0]] = 0; }
      if (!(d.teams[1] in dGoalsLocal)) { dGoalsLocal[d.teams[1]] = 0; }
      if (!(d.teams[0] in dGoalsVisitor)) { dGoalsVisitor[d.teams[0]] = 0; }
      if (!(d.teams[1] in dGoalsVisitor)) { dGoalsVisitor[d.teams[1]] = 0; }



      result.push({
        team:d.teams[0],
        img: "flags/Flag_of_"+d.teams[0] + ".svg",
        goals: dGoals[d.teams[0]]+=+d.score[0],
        goalsAgainst: dGoalsAgainst[d.teams[0]]+=+d.score[1],
        goalsVisitor: dGoalsLocal[d.teams[0]]+=+d.score[0],
        goalsLocal: dGoalsVisitor[d.teams[0]],
        points: dPoints[d.teams[0]]+= +d.score[0] === +d.score[1] ? 1 :
          +d.score[0] > +d.score[1] ? 3 :0,
        round:d.round,
      });

      result.push({
        team: d.teams[1],
        img: "flags/Flag_of_"+d.teams[1] + ".svg",
        goals: dGoals[d.teams[1]]+=+d.score[1],
        goalsAgainst: dGoalsAgainst[d.teams[1]]+=+d.score[0],
        goalsVisitor: dGoalsLocal[d.teams[1]],
        goalsLocal: dGoalsVisitor[d.teams[1]]+=+d.score[1],
        points: dPoints[d.teams[1]]+= +d.score[0] === +d.score[1] ? 1 :
          +d.score[1] > +d.score[0] ? 3 :0,
        round:d.round,
      });

    });

  rounds = d3.extent(result, function (d) { return d.round;});
  d3.range(rounds[0],rounds[1]+1).forEach(function (r) {
    // Look at the results of a round only
    result.filter(function (d) {
        return d.round === r})
      .sort(function (a,b) {
        // Rank it
        return d3.descending(a.points, b.points) ||
        d3.descending(+a.goals-a.goalsAgainst, +b.goals - b.goalsAgainst) ||
        d3.descending(a.goals, b.goals)  ||
        d3.descending(a.goalsVisitor, b.goalsVisitor) ||
        d3.descending(a.goalsLocal, b.goalsLocal) ||
        d3.ascending(a.team, b.team);

      }).forEach(function (d, ranking) {
        // Add the ranking to the data
        d.ranking = ranking+1;
    });
  });

  return result;
}



function redrawRanges(filteredData) {

  var maxRound = d3.max(filteredData, function (d) { return d.round; });
  var margin = myBumpChart.margin();
  var boxW = myBumpChart.boxW(),
    boxH = myBumpChart.boxH();
  var separation;
  var lastRound = filteredData.filter(function (d) {
    return d.round === maxRound;
  }).sort(function (a, b) { return d3.ascending(a.ranking, b.ranking); });

  var classifiedData = [
    {range: [lastRound[0],lastRound[3]],
      name: "Clasifican",
      color: "#00c70d"
    },
    {range: [lastRound[4],lastRound[4]],
      name: "Repechaje",
      color: "#e6de42"
    },
    {range: [lastRound[5],lastRound[lastRound.length-1]],
      name: "Eliminados",
      color: "#f55a5a"
    }
  ]

  var classifiedSel = d3.select("#chart svg")
    .selectAll(".classified-range")
    .data(classifiedData, function (d) { return d.name; } );

  var classifiedEnter = classifiedSel.enter()
    .insert("g", ":first-child")
    .attr("class", "classified-range");
  classifiedEnter.append("rect")
    .attr("class" ,"range");
  classifiedEnter.append("text")
    .attr("class" ,"legend");

  var chartY = function (val) {
    return myBumpChart.yScale()(myBumpChart.y()(val));
  }

  //How much space is there between two teams
  separation = chartY(lastRound[1]) - chartY(lastRound[0]);
  classifiedSel
    .transition()
    .duration(500)
    .attr("transform", function (d) {
      return   "translate(" + (margin.left - boxW/2) +"," + (chartY(d.range[0]) - separation/2 + margin.top) + ")";
    })
    .select("rect")
      .style("fill", function (d) { return d.color; })
      .style("opacity", 0.1)
      .transition()
      .duration(500)
      .attr("x", 0)
      .attr("y", 0)
      .attr("rx", 15)
      .attr("ry", 15)
      .attr("width", myBumpChart.width() -margin.left - margin.right + boxW)
      .attr("height", function (d) { return chartY(d.range[1]) - chartY(d.range[0]) + separation; });
  classifiedSel
    .select(".legend")
      .style("text-anchor", "middle")
      .text(function (d) { return d.name; })
      .transition()
      .duration(500)

      // .attr("dx", myBumpChart.width() - margin.left )
      // .attr("dy", 25)

      .attr("transform", function (d) {
        return "translate("+ (myBumpChart.width() - margin.left - margin.right + boxW +5 ) +","+ ((chartY(d.range[1]) - chartY(d.range[0]) + separation)/2) +") rotate(90)";
      });

  classifiedSel.exit().remove();

}

function redraw() {
    var isBump = d3.select("#chBump").property("checked");
    var maxRound = +d3.select("#slRound").property("value");

    var filteredData = ranking.filter(function (d) { return d.round<=maxRound; });
    myBumpChart
      .y(function (d) { return isBump? d.ranking: d.points; })
      // .y(function (d) { return d.points; })
      .isBumpChart(isBump)
      .topN(15)

      .xScale(d3.scale.linear())
      .colScale(d3.scale.ordinal()
          .domain(["Argentina", "Bolivia", "Brazil", "Colombia", "Chile", "Ecuador", "Paraguay", "Peru", "Uruguay", "Venezuela"])
          .range(["#aec7e8",   "#98df8a", "#2ca02c","#FCD116", "#d62728", "#ffbb78", "#ff9896", "#e377c2", "#9edae5", "#dbdb8d"])
          )
      // .topN(numPhotos)
      .xLabel("Ronda")
      .yLabel(isBump ? "Posición" : "Puntos")
      .height(window.innerWidth > 700 ? height : window.innerWidth > 300 ? 400: 200 )
      // .height(400)
      // .width(document.getElementById("chart").offsetWidth)
      .width(document.getElementById("chart").offsetWidth)
      // .width(width);
    // console.log(maxRound);






    d3.select("#chart")
      .datum(filteredData)
      .call(myBumpChart);

    redrawRanges(filteredData, maxRound);

}

d3.json("eliminatorias2018.json", function(error, data) {
  if (error) throw error;

  data.forEach(function (d) {
    if (d.teams[0] ==="Perú") d.teams[0]="Peru";
    if (d.teams[1] ==="Perú") d.teams[1]="Peru";
  });
  ranking = computeRanking(data);



  myBumpChart = bumpChartPhotos()
    .x(function (d) { return d.round; })
    // .x(function (d) { return d.daysSinceUploaded; })
    // .x(function (d) { return d.daysSinceTaken; })
    .key(function (d) { return d.team; })
    // .img(function (d) { return d.img; })
    // .onClick(function (d) { window.open(d.url,'_blank'); })

    .width(document.getElementById("chart").offsetWidth);



  redraw();

  window.addEventListener("resize", redraw);
  d3.select("#chBump").on("change", redraw);
  d3.select("#slRound")
    .attr("min", rounds[0])
    .attr("max", rounds[1])
    .on("input", redraw);




});

