//
// ROK web service access statistics
//

var routesChart = dc.rowChart(".routes-chart");

var meanTimeDisplay = dc.numberDisplay(".meanTime");
var meanSizeDisplay = dc.numberDisplay(".meanSize");

var dsv = d3.dsv(" ", "text/plain");

dsv("access_stats_2.txt", function(data) {

  //
  // I. Data part
  //
  var ndx = crossfilter(data);

  var all = ndx.groupAll();

  // methods
  var method = ndx.dimension(function(d) {
    return d.method;
  })
  var methodGroup = method.group();

  // route
  var route = ndx.dimension(function (d) {
    return d.route;
  });
  var routeGroup = route.group();

  // size
  var size = ndx.dimension(function (d) {
    return d.size;
  });
  var sizeGroup = size.group();

  // time of the day
  var time = ndx.dimension(function (d) {
    return d.time;
  });
  var timeGroup = time.group();

  var meansGroup = ndx.groupAll().reduce(
    function (p, v) {
      ++p.n;
      p.time_tot += v.time;
      p.size_tot += v.size;
      return p;
    },
    function (p, v) {
      --p.n;
      p.time_tot -= v.time;
      p.size_tot -= v.size;
      return p;
    },
    function () { return {n:0,time_tot:0,size_tot:0}; }
  );

  var average_size = function(d) {
      return d.n ? d.size_tot / d.n : 0;
  };

   var average_time = function(d) {
      return d.n ? d.time_tot / d.n : 0;
  };

  //
  // II. Chart parts
  //

  meanTimeDisplay
       .valueAccessor(average_time)
       .group(meansGroup);

  meanSizeDisplay
       .formatNumber(d3.format(".4s"))
       .valueAccessor(average_size)
       .group(meansGroup);

  // route
  routesChart.width(990)
             .height(30 * routeGroup.size())
             .margins({top: 10, left: 10, right: 10, bottom: 30})
             .dimension(route)
             .group(routeGroup)
             .ordering(function(d, i) {
                return -d.value;
             })
             .colors(d3.scale.category20())
             .label(function (d) {
                 return d.key;
             })
             .title(function (d) {
                 return d.value;
             })
             .elasticX(true)
             .xAxis().ticks(4);


  // count selected commits
  dc.dataCount(".dc-data-count").dimension(ndx)
                                .group(all);

  // render everything
  dc.renderAll();

}).response(function(request) {

  return dsv.parseRows(request.responseText, function(d) {
    // format style :
    // GET /api/campaign_chapters 108 188
    return {
      method: d[0],
      route: d[1].replace(/(\d+)/, ":id"),
      size: +d[2],
      time: +d[3]
    };
  });

});
