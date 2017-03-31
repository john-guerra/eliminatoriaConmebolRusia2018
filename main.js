/*eslint browser: true, indent: 2 */
/* global d3: false, $: false, alert: false, bumpChartPhotos: false , FlickrUtils: true, console: true, utils: true */

//Main
"use strict";

var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 960 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
function redraw() {
    var isBump = d3.select("#chBump").property("checked");
    var maxRound = +d3.select("#slRound").property("value");
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
      .height(height)
      .width(document.getElementById("chart").offsetWidth)
      // .width(width);
    console.log(maxRound);
    d3.select("#chart")
      .datum(ranking.filter(function (d) { return d.round<=maxRound; }))

      .call(myBumpChart);
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

