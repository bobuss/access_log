//
// ROK web service access statistics
//
var ndx, all, byRoute, byRoute1, byRoute2, byRouteGroup, timeByRoute,
    sizeByRoute, bySize, bySizeGroup, byTime, byTimeGroup;

var meanTimeDisplay = dc.numberDisplay(".meanTime");
var meanSizeDisplay = dc.numberDisplay(".meanSize");
var routesChartTime = dc.rowChart("#routes-time");
var routesChartSize = dc.rowChart("#routes-size");
var sizeChart = dc.barChart('#size');
var timeChart = dc.barChart('#time');
var routesChart = dc.pieChart("#routes");

var dsv = d3.dsv(" ", "text/plain");

dsv("access_2014_14_18.log", function(data) {

  //
  // I. Data part
  //
  ndx = crossfilter(data);

  all = ndx.groupAll();

  // route
  byRoute1 = ndx.dimension(function (d) {
    return d.route;
  });

  timeByRoute = byRoute1.group().reduce(
    function reduceAdd(p, v) {
      ++p.n;
      p.time_tot += v.time;
      p.avg = p.n != 0 ? p.time_tot / p.n : 0;
      return p;
    },
    function reduceRemove(p, v) {
      --p.n;
      p.time_tot -= v.time;
      p.avg = p.n != 0 ? p.time_tot / p.n : 0;
      return p;
    },
    function reduceInitial() {
      return {n:0,time_tot:0};
    }
  );

  // route
  byRoute2 = ndx.dimension(function (d) {
    return d.route;
  });

  sizeByRoute = byRoute2.group().reduce(
    function reduceAdd(p, v) {
      ++p.n;
      p.size_tot += v.size;
      p.avg = p.n != 0 ? p.size_tot / p.n : 0;
      return p;
    },
    function reduceRemove(p, v) {
      --p.n;
      p.size_tot -= v.size;
      p.avg = p.n != 0 ? p.size_tot / p.n : 0;
      return p;
    },
    function reduceInitial() {
      return {n:0,size_tot:0};
    }
  );

  // size
  bySize = ndx.dimension(function (d) {
    return Math.ceil(d.size/1000);
  });
  bySizeGroup = bySize.group();

  // time
  byTime = ndx.dimension(function (d) {
    return Math.ceil(d.time/10);
  });
  byTimeGroup = byTime.group();

  // routes
  byRoute = ndx.dimension(function (d) {
    return d.route;
  });
  byRouteGroup = byRoute.group();


  var meansGroup = ndx.groupAll().reduce(
    function reduceAdd(p, v) {
      ++p.n;
      p.time_tot += v.time;
      p.size_tot += v.size;
      return p;
    },
    function reduceRemove(p, v) {
      --p.n;
      p.time_tot -= v.time;
      p.size_tot -= v.size;
      return p;
    },
    function reduceInitial() {
      return {n:0, size_tot:0, time_tot:0};
  });

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


  // routes times
  routesChartTime.width(400)
            .height(30 * byRoute1.group().size())
            .dimension(byRoute1)
            .group(timeByRoute)
            .colors(d3.scale.category20b())
            .colorDomain([0, 1500])
            .valueAccessor(function(d) {
              return d.value.avg;
            })
            .title(function(d) {
                return d.key + "\nAverage load time : " + (d.value.avg ? Math.ceil(d.value.avg) : 0) + " ms";
            });

  // route sizes
  routesChartSize.width(400)
            .height(30 * byRoute2.group().size())
            .dimension(byRoute2)
            .group(sizeByRoute)
            .colors(d3.scale.category20b())
            .colorDomain([-5, 200])
            .valueAccessor(function(d) {
              return d.value.avg;
            })
            .title(function(d) {
                return d.key + "\nAverage request size : " + (d.value.avg ? Math.ceil(d.value.avg/1024) : 0) + " KB";
            });

  sizeChart.width(400)
            .height(400)
            .dimension(bySize)
            .group(bySizeGroup)
            .elasticY(true)
            .x(d3.scale.linear().domain([0, 150]));

  timeChart.width(400)
            .height(400)
            .dimension(byTime)
            .group(byTimeGroup)
            .elasticY(true)
            .x(d3.scale.linear().domain([0, 200]));

  routesChart.width(400)
            .height(400)
            .radius(100)
            .innerRadius(40)
            .dimension(byRoute)
            .group(byRouteGroup);


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
      route: d[1].replace(/(\d+)/g, ":id"),
      size: +d[2],
      time: +d[3]
    };
  });

});
