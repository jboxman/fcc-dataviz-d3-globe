/*
User Story: I can see where all Meteorites landed on a world map.

User Story: I can tell the relative size of the meteorite, just by looking at the way it's represented on the map.

User Story: I can mouse over the meteorite's data point for additional data.

Hint: Here's a dataset you can use to build this: https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json
*/

// Define module using Universal Module Definition pattern
// https://github.com/umdjs/umd/blob/master/returnExports.js

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // Support AMD. Register as an anonymous module.
    // EDIT: List all dependencies in AMD style
    define(['d3'], factory);
  }
  else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    // EDIT: Pass dependencies to factory function
    module.exports = factory(require('d3'));
  }
  else {
    // No AMD. Set module as a global variable
    // EDIT: Pass dependencies to factory function
    root.d3.promise = factory(root.d3);
  }
}(this,
//EDIT: The dependencies are passed to this function
function (d3) {
  //---------------------------------------------------
  // BEGIN code for this module
  //---------------------------------------------------

  var d3Promise = (function(){

    function promisify(caller, fn){
      return function(){
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function(resolve, reject){
          var callback = function(error, data){
            if(error){
              reject(Error(error));
              return;
            }
            resolve(data);
          };
          fn.apply(caller, args.concat(callback));
        });
      };
    }

    var module = {};

    ['csv', 'tsv', 'json', 'xml', 'text', 'html'].forEach(function(fnName){
      module[fnName] = promisify(d3, d3[fnName]);
    });

    return module;
  }());

  // append to d3
  d3.promise = d3Promise;

  // return module
  return d3Promise;

  //---------------------------------------------------
  // END code for this module
  //---------------------------------------------------
}));

// Predominately based upon
// http://bl.ocks.org/d3noob/5193723
// with adjustments and enhancements as necessary.

var topoData,
  $svg,
  $g,
  $tooltip,
  $tmpl,
  massScale = d3.scale.linear(),
  colorScale = d3.scale.category10(),
  projection = d3.geo.mercator()
    .center([0, 25])
    .scale(150)
    .rotate([-10,0]),
  path = d3.geo.path().projection(projection);

$toolTip = d3.select('.tooltip');
tmpl = $.templates('#tmpl');

$svg = d3.select('#chart').append('svg');
$g = $svg.append('g');

// http://data-map-d3.readthedocs.org/en/latest/steps/step_11.html
$svg.attr('preserveAspectRatio', 'xMidYMid')
.attr('viewBox', '0 0 ' + 960 + ' ' + 500);

massScale.range([1, 1000]);
/*
colorScale.range([
  '#5E4FA2', '#3288BD', '#66C2A5', '#ABDDA4', '#E6F598', '#FFFFBF',
  '#FEE08B', '#FDAE61', '#E06D43', '#D53E4F', '#9E0142', '#FFFFFF']);
  */

$(function() {
  var hits;

  topoData = d3.promise.json('https://dl.dropboxusercontent.com/s/r4vj2zzs6rcr9bg/world-110m2.json?dl=0').then(drawMap);
  topoData.then(() => (d3.promise.json('https://dl.dropboxusercontent.com/s/kt6dtz4n5276zqv/meteorite-strike-data.json?dl=0'))).then(drawImpacts);

  function drawImpacts(impacts) {
    var features = impacts.features;

    // Sort the data such that small circles are drawn on top of larger ones.
    data = features.filter(function(v) {
      if(v.geometry && v.properties.mass) {
        return true;
      }
      else {
        return false;
      }
    })
    .sort(function(b, a) {
      return +b.properties.mass < +a.properties.mass;
    });

    massScale.domain(d3.extent(data, (v) => (+v.properties.mass)));
    colorScale.domain([
      Math.sqrt(massScale(massScale.domain()[0]) *4/Math.PI),
      Math.sqrt(massScale(massScale.domain()[1]) *4/Math.PI)
    ]);

/*
"properties": {
"fall": "Fell",
"mass": "21",
"name": "Aachen",
"nametype": "Valid"
"recclass": "L5",
"reclat": "50.775000",
"reclong": "6.083330",
"year": "1880-01-01T00:00:00.000",
*/

  hits = $g.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) {
     return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
    })
    .attr('cy', function(d) {
     return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
    })
    .attr('r', function(d) {
     // Example 2 from:
     // http://bl.ocks.org/mpmckenna8/566509dd3d9a08e5f9b2
     // TODO
     // Use this value for a color scheme
     return Math.sqrt(massScale(d.properties.mass) *4/Math.PI);
    })
    .style('fill', function(d) {
      return colorScale(d.properties.mass);
    });

    hits.on({
      'mouseover': function(d) {
        var props = d.properties;

        $toolTip.html(tmpl.render({
          mass:props.mass,
          name:props.name,
          year:props.year}));

        $toolTip.transition().duration(200).style('opacity', .9);
        $toolTip.style({
          'left': (d3.event.pageX) + "px",
          'top': (d3.event.pageY - 28) + "px"
          });
      },
      'mouseout': () => {$toolTip.transition().style('opacity', 0);}
    });
  }

  function drawMap(topology) {
    $g.selectAll('path')
    .data(topojson.feature(topology, topology.objects.countries).features)
    .enter()
    .append('path')
    .attr('d', path)
  }
});