(function() {

  var AMADEUS_API_KEY = 'AlN6Wa4wNlBfYx9osGST0C8GvXovPfjG';

  var getMyLocation = function() {
    var deferred = $.Deferred();

    navigator.geolocation.getCurrentPosition(
      deferred.resolve,
      deferred.reject
    );

    return deferred.promise();
  }

  var getClosestAirportIATA = function(myLocation) {
    var deferred = $.Deferred(),
      lat = myLocation.coords.latitude,
      lng = myLocation.coords.longitude;

    $.getJSON('http://api.sandbox.amadeus.com/v1.2/airports/nearest-relevant?latitude=' + lat + '&longitude=' + lng + '&apikey=' + AMADEUS_API_KEY)
      .then(function(airports) {
        deferred.resolve(airports[0].city);
      });

    return deferred.promise();
  }

  var getAirport = $.when(getMyLocation()).pipe(getClosestAirportIATA);
  var loadLocationData = $.getJSON('https://spreadsheets.google.com/feeds/list/1LphH9qoFgw9VdgHmP_fIaAJJzHXfEDhfhwaHMMHaZB8/od6/public/values?alt=json-in-script&callback=?');

  $.when(getMyLocation(), getAirport, loadLocationData).then(function(myLocation, fromIATA, locations) {
    $('#my-airport').text(fromIATA);

    var lat = myLocation.coords.latitude,
      lng = myLocation.coords.longitude;

    var entries = locations[0].feed.entry,
      filteredEntries = $.grep(entries, function(item, index) {
        var distance = Math.sqrt(Math.pow(Math.abs(lat - parseFloat(item.gsx$lat.$t)), 2) + Math.pow(Math.abs(lng - parseFloat(item.gsx$lng.$t)), 2));
        return distance > 10;
      });

    showEntry(fromIATA, filteredEntries);
    $('#shuffle').on('click', function() {
      showEntry(fromIATA, filteredEntries);
    });
  });

  function showEntry(fromIATA, filteredEntries) {
    var shuffledEntries = shuffle(filteredEntries);

    var now = moment(),
      in2weeks = now.clone().add(2, 'weeks'),
      in6weeks = now.clone().add(6, 'weeks');

    function tryLoadRandomEntry() {
      var destination = shuffledEntries.pop();

      var photoURL = destination.gsx$photourl.$t;

      var imageLoaded = $.Deferred(),
        infoLoaded = $.Deferred();

      // Preload and then show the image
      $('#preloader')
        .attr('src', photoURL)
        .on('load', imageLoaded.resolve);

      var toIATA = destination.gsx$iatacode.$t;

      $.getJSON('http://api.sandbox.amadeus.com/v1.2/flights/extensive-search?origin=' + fromIATA + '&destination=' + toIATA + '&departure_date=' + in2weeks.format('YYYY-MM-DD') + '--' + in6weeks.format('YYYY-MM-DD') + '&duration=6--14&apikey=' + AMADEUS_API_KEY)
        .then(infoLoaded.resolve)
        .fail(tryLoadRandomEntry);

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
    }
    tryLoadRandomEntry();
  };

})();

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
