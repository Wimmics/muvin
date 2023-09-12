const port = 8020

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const https = require("https")


const { TransformFactory } = require('./datatools/transformFactory')


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
app.get(prefix + '/:app', function (req, res) {
    res.render('index', { app: req.params.app, params: req.query } );
})

app.get(prefix + '/data/:app/nodes', async function(req, res) {
    let parentdir = path.join(__dirname, 'data/')
   
    if (!fs.existsSync(parentdir)){
        fs.mkdirSync(parentdir);
    }

    let dir = path.join(__dirname, `data/${req.params.app}/`)
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    let datafile = path.join(__dirname, `data/${req.params.app}/nodes.json`)
        
    if (fs.existsSync(datafile)) {
        res.sendFile(datafile)
    } else {
        let transform = TransformFactory.getTransform(req.params.app)
        let result = await transform.fetchNodeLabels()
        res.send(JSON.stringify(result))
    }
})

app.get(prefix + '/data/:app', async function(req, res) {
   
    let node = {value: req.query.value, type: req.query.type === 'undefined' ? undefined : req.query.type}

    let filename = `data/${req.params.app}/${node.value}${node.type ? '-' + node.type : ''}-data_vis.json`
    
    let datafile = path.join(__dirname, filename);
    if (fs.existsSync(datafile))
        res.sendFile(datafile);
    else {
        let transform = TransformFactory.getTransform(req.params.app)
        let result = await transform.getData(node)
        res.send(JSON.stringify(result))
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

app.listen(port, async () => { console.log(`HTTP Server started at port ${port}.`) })

let privateKey = fs.readFileSync( '/etc/httpd/certificate/exp_20240906/dataviz_i3s_unice_fr.key' )
let certificate = fs.readFileSync( '/etc/httpd/certificate/exp_20240906/dataviz_i3s_unice_fr_cert.crt' )
let ca = fs.readFileSync( '/etc/httpd/certificate/exp_20240906/dataviz_i3s_unice_fr_AC.cer' )
var options = { key: privateKey, cert: certificate, ca: ca }
https.createServer( options, function(req,res) {
    app.handle( req, res );
} ).listen( 8023, async () => { console.log(`HTTPS Server started at port ${8023}.`) } );

