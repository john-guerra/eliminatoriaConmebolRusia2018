"use strict";
//Code

var scraperjs = require("scraperjs");
var _ = require("lodash");
var d3 = require("d3");

var timeFormat = d3.isoParse;//.utc("%Y-%m-%dT%H:%M");

function getMatches(wikiPageUrl, timeZone){
  return scraperjs.StaticScraper.create(wikiPageUrl)
    .scrape(function($) {

      let i = 0;
      return $("table.vevent").map(function() {


        // console.log($(this));
        const $this = $(this);

        const date = $this.find("tr:nth-child(1) td:nth-child(1) small").text().trim();
        console.log(date);
        const teams = [
          $this.find("tr:nth-child(1) td:nth-child(2) a").text().trim(),
          $this.find("tr:nth-child(1) td:nth-child(4) a").text().trim()];
        const flags = [
          $this.find("tr:nth-child(1) td:nth-child(2) img").attr("src"),
          $this.find("tr:nth-child(1) td:nth-child(4) img").attr("src")];

        console.log(teams);
        console.log(flags);

        const scoreText = $this.find("tr:nth-child(1) td:nth-child(3) b").text().trim();
        const score = scoreText.split(":");
        console.log(score);


        let header = $this.prev();
        let j=0;
        while (header.get(0).name!=="h4") {
          // console.log("...");
          // console.log(header.get(0).name);
          header = header.prev();
          if (++j>20) break;
        }

        const round = +header.text().split("[")[0].split(" ")[1];
        console.log(round);

        // if (++i>10) throw "Done";
        // throw "ya";

        return {
          date: date,
          teams: teams,
          flags: flags,
          score: score,
          round: round
        };
      })
      .get()
      .filter(function (d) { return d.score[0]!=="vs."; })
      .sort(function(a,b){
        const t1 = new Date(a.time).getTime();
        const t2 = new Date(b.time).getTime();
        return t1-t2;
      });
    });
}


//USAGE

const fs = require("fs");

getMatches("https://es.wikipedia.org/wiki/Anexo:Resultados_de_la_clasificaci%C3%B3n_de_Conmebol_para_la_Copa_Mundial_de_F%C3%BAtbol_de_2018", -4)
  .then(function(matches){
    const json = JSON.stringify(matches, null, 2);
    fs.writeFileSync(__dirname+"/eliminatorias2018.json", json);
  });
