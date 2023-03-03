const port = 8020

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const datatools = require('./datatools')


// const data = new Data()

/**
 * HTTP node server
 * Browser form send HTTP request to this node server
 * Send query to SPARQL endpoint and perform transformation 
 * 
 */
const app = express()

// Pour accepter les connexions cross-domain (CORS)
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});
  
// Pour les formulaires
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
  
// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(bodyParser.json());

let prefix = '/muvin'

app.use(prefix, express.static(path.join(__dirname, 'public')))

// index page 
app.get(prefix, function (req, res) {
    res.render('about');
})

// index page 
app.get(prefix + '/demo', function (req, res) {
    res.render('index');
})

app.get(prefix + '/data/:app/nodes', async function(req, res) {
    let dir = path.join(__dirname, `data/${req.params.app}/`)
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    let datafile = path.join(__dirname, `data/${req.params.app}/nodes.json`)
        
    if (fs.existsSync(datafile)) {
        res.sendFile(datafile)
    } else res.send(JSON.stringify(await datatools.fetchNodes(req.params.app)))
})

app.get(prefix + '/data/:app/:value', async function(req, res) {
    let datafile = path.join(__dirname, `data/${req.params.app}/${req.params.value}-data_vis.json`);
    if (fs.existsSync(datafile))
        res.sendFile(datafile);
    else {
        res.send(JSON.stringify(await datatools.fetchData(req.params.app, req.params.value)))
    }
})

// About page 
app.get(prefix + '/about', function (req, res) {
    res.render("pages/about");
})

app.get(prefix + '/testdata', function(req, res) {
    let datafile = path.join(__dirname, "data/testdata.json");
    if (fs.existsSync(datafile)) {
        res.sendFile(datafile)
    }
    else {
        let originaldata = path.join(__dirname, "data/wasabidata_vis.json");
        let data = fs.readFileSync(originaldata)
        data = JSON.parse(data)

        let fArtists = [];
        for ( let i = 0; i < 100; i++) {
            let a = {'name': "artist"+i, id: i, audio: false}
            fArtists.push(a)
            data.artists[a.name] = a;
        }

        for (let d = 1967; d < 2017; d++) {
            for (let a of fArtists) {
                let n = Math.floor(Math.random() * 10) + 1;
                for (let i = 0; i < n; i ++) {
                    let item = {
                        artist: { name: a.name, contribution: ['performer'] },
                        collaborators: [a.name],
                        year: d.toString(),
                        type: 'song',
                        audio: false
                    }
                    data.items.push(item)
                    data.groupedItems.push(item)
                }
            }
        }

        fs.writeFileSync(datafile, JSON.stringify(data, null, 4))

        res.send(JSON.stringify(data))
    }
})

app.listen(port, async () => { console.log(`Server started at port ${port}.`) })

