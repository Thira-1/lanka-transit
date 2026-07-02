// ── Import tools ──
const express   = require('express');
const cors      = require('cors');
const path      = require('path');

const app  = express();
const PORT = 3000;

// ── Middleware ──
// These lines set up basic server behaviour
app.use(cors());                              // allow frontend to talk to backend
app.use(express.json());                      // allow JSON data in requests
app.use(express.static('public'));            // serve your HTML/CSS/JS files

// ══════════════════════════════════════
//  OUR DATA (same as before, but now
//  it lives on the SERVER not the browser)
// ══════════════════════════════════════
const TRAINS = {
  "Colombo Fort-Kandy": [
    { name:"Intercity Express", dep:"06:05", arr:"08:30", dur:"2h 25m", fare:160, type:"express" },
    { name:"Udarata Menike",    dep:"07:00", arr:"09:55", dur:"2h 55m", fare:120, type:"train"   },
    { name:"Podi Menike",       dep:"08:30", arr:"11:20", dur:"2h 50m", fare:120, type:"train"   },
    { name:"Night Mail",        dep:"21:30", arr:"00:15", dur:"2h 45m", fare:100, type:"train"   }
  ],
  "Colombo Fort-Galle": [
    { name:"Ruhunu Kumari",  dep:"06:15", arr:"09:00", dur:"2h 45m", fare:130, type:"train" },
    { name:"Galu Kumari",    dep:"09:30", arr:"12:10", dur:"2h 40m", fare:100, type:"train" }
  ],
  "Colombo Fort-Jaffna": [
    { name:"Yal Devi",    dep:"06:00", arr:"12:30", dur:"6h 30m", fare:450, type:"express" },
    { name:"Uttara Devi", dep:"16:00", arr:"22:30", dur:"6h 30m", fare:450, type:"express" }
  ],
  "Colombo Fort-Matara": [
    { name:"Ruhunu Kumari", dep:"06:15", arr:"09:30", dur:"3h 15m", fare:150, type:"train"   },
    { name:"Matara Express",dep:"14:00", arr:"17:10", dur:"3h 10m", fare:160, type:"express" }
  ]
};

const DISTANCES = {
  "Colombo Fort-Kandy":120,
  "Colombo Fort-Galle":118,
  "Colombo Fort-Jaffna":398,
  "Colombo Fort-Matara":162,
  "Colombo Fort-Anuradhapura":205
};

// ══════════════════════════════════════
//  API ROUTES
//  These are URLs your frontend can call
// ══════════════════════════════════════

// GET /api/trains?from=Colombo Fort&to=Kandy
app.get('/api/trains', function(req, res) {
  var from = req.query.from;
  var to   = req.query.to;
  var key  = from + '-' + to;
  var rkey = to + '-' + from;

  var trains = TRAINS[key] || TRAINS[rkey] || [];
  res.json({ success: true, from, to, trains });
});

// GET /api/buses?q=kandy
app.get('/api/buses', function(req, res) {
  var q = (req.query.q || '').toLowerCase();

  var BUSES = [
    { route:"100", name:"Colombo → Kandy (Highway Express)", freq:"Every 20 min", fare:180 },
    { route:"2",   name:"Colombo → Negombo",                 freq:"Every 15 min", fare:80  },
    { route:"98",  name:"Colombo → Galle",                   freq:"Every 30 min", fare:120 },
    { route:"32",  name:"Colombo → Anuradhapura",            freq:"Every 45 min", fare:220 },
    { route:"48",  name:"Colombo → Matara (Expressway)",     freq:"Every 30 min", fare:200 }
  ];

  var results = q
    ? BUSES.filter(b => b.name.toLowerCase().includes(q) || b.route.includes(q))
    : BUSES;

  res.json({ success: true, results });
});

// GET /api/fare?from=Colombo Fort&to=Kandy&mode=Train&class=2nd class
app.get('/api/fare', function(req, res) {
  var from  = req.query.from;
  var to    = req.query.to;
  var mode  = req.query.mode  || 'Train';
  var cls   = req.query.class || '3rd class';

  var key  = from + '-' + to;
  var rkey = to   + '-' + from;
  var dist = DISTANCES[key] || DISTANCES[rkey] || 130;

  var rates = {
    Train: { '3rd class':0.90, '2nd class':1.44, '1st class':2.16, 'A/C':3.20 },
    Bus:   { '3rd class':0.75, '2nd class':1.10, '1st class':1.60, 'A/C':1.80 }
  };

  var rate = rates[mode][cls] || 0.9;
  var fare = Math.round(dist * rate);

  res.json({ success:true, from, to, mode, class:cls, dist, fare });
});

// GET /api/weather?city=Kandy
app.get('/api/weather', async function(req, res) {
  var city = req.query.city;

  var COORDS = {
    "Colombo Fort": { lat:6.9344, lon:79.8428 },
    "Kandy":        { lat:7.2906, lon:80.6337 },
    "Galle":        { lat:6.0535, lon:80.2210 },
    "Jaffna":       { lat:9.6615, lon:80.0255 },
    "Matara":       { lat:5.9549, lon:80.5550 }
  };

  var coords = COORDS[city];
  if (!coords) return res.json({ success:false, error:'City not found' });

  try {
    // Fetch from Open-Meteo on the SERVER side (safer)
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat +
              '&longitude=' + coords.lon + '&current_weather=true';

    var response = await fetch(url);
    var data     = await response.json();

    res.json({
      success: true,
      city,
      temperature: data.current_weather.temperature,
      windspeed:   data.current_weather.windspeed,
      weathercode: data.current_weather.weathercode
    });
  } catch(e) {
    res.json({ success:false, error:'Could not fetch weather' });
  }
});

// ── Start the server ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Lanka Transit server running on port ' + PORT);
});