(function() {

  var AMADEUS_API_KEY = 'AlN6Wa4wNlBfYx9osGST0C8GvXovPfjG';

  var getMyPosition = function() {
    var deferred = $.Deferred();

    navigator.geolocation.getCurrentPosition(
      deferred.resolve,
      deferred.reject
    );

    return deferred.promise();
  }

  var getClosestAirportIATA = function(position) {
    var deferred = $.Deferred(),
      lat = position.coords.latitude,
      lng = position.coords.longitude;

    $.getJSON('http://api.sandbox.amadeus.com/v1.2/airports/nearest-relevant?latitude=' + lat + '&longitude=' + lng + '&apikey=' + AMADEUS_API_KEY)
      .then(function(airports) {
        deferred.resolve(airports[0].city);
      });

    return deferred.promise();
  }

  var getAirport = $.when(getMyPosition()).pipe(getClosestAirportIATA);
  var loadLocationData = $.getJSON('https://spreadsheets.google.com/feeds/list/1LphH9qoFgw9VdgHmP_fIaAJJzHXfEDhfhwaHMMHaZB8/od6/public/values?alt=json-in-script&callback=?');

  $.when(getAirport, loadLocationData)
    .then(function(fromIATA, locations) {
      $('#my-airport').text(fromIATA);
      var entries = locations[0].feed.entry;

      showEntry(fromIATA, entries[Math.floor(Math.random() * entries.length)]);
      $('#shuffle').on('click', function() {
        showEntry(fromIATA, entries[Math.floor(Math.random() * entries.length)]);
      });
    });

  function showEntry(fromIATA, destination) {
    var photoURL = destination.gsx$photourl.$t;

    var imageLoaded = $.Deferred(),
      infoLoaded = $.Deferred();

    // Preload and then show the image
    $('#preloader')
      .attr('src', photoURL)
      .on('load', imageLoaded.resolve);

    var now = moment(),
      in2weeks = now.clone().add(2, 'weeks'),
      in6weeks = now.clone().add(6, 'weeks');

    var toIATA = destination.gsx$iatacode.$t;

    $.getJSON('http://api.sandbox.amadeus.com/v1.2/flights/extensive-search?origin=' + fromIATA + '&destination=' + toIATA + '&departure_date=' + in2weeks.format('YYYY-MM-DD') + '--' + in6weeks.format('YYYY-MM-DD') + '&duration=6--14&apikey=' + AMADEUS_API_KEY)
      .then(infoLoaded.resolve);

    $.when(imageLoaded.promise(), infoLoaded.promise())
      .then(function(a, flights) {
        $('#scene').removeClass('transition');
        $('.loading').hide();

        $('#scene')
          .css('backgroundImage', 'url(' + photoURL + ')')
          .addClass('transition');

        var bestMatch = flights[0].results[0],
          departure_date = moment(bestMatch.departure_date, 'YYYY-MM-DD'),
          return_date = moment(bestMatch.return_date, 'YYYY-MM-DD'),
          price = bestMatch.price;

        $('#departure-date').text(departure_date.format('MMM DD'));
        $('#return-date').text(return_date.format('MMM DD'));
        $('#price').text(price);
        $('#destination').text(destination.gsx$iatacode.$t);
        $('.book a').attr('href', 'http://www.skyscanner.com/transport/flights/' + fromIATA + '/' + toIATA + '/' + departure_date.format('YYMMDD') + '/' + return_date.format('YYMMDD'));
      });
  };

})();
