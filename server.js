

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const https = require("https")

const { TransformFactory } = require('./datatools/transformFactory')
const { datasets } = require('./datatools/queries')
const sparql = require('./datatools/sparql_helper')
const crypto = require('crypto')

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

// // route for launching muvin through ldviz 
// app.get(prefix + "/preview", async function(req, res) {
//     res.render('index', req.query )
// })

// index page 
app.get(prefix + '/:app', function (req, res) {
    let params = req.query // receive query and endpoint in the URL
    if (datasets[req.params.app]) { // or is it from pre-defined apps
        params = {
            query: datasets[req.params.app].items,
            endpoint: datasets[req.params.app].endpoint
        }
    }
    
    params.hashCode = hash(params.query, params.endpoint)

    res.render('index', { app: req.params.app, params: params } );
})

// route to retrieve pre-queries nodes (for hal, wasabi and crobora apps)
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
    } else if (datasets[req.params.app]) {
        let endpoint = datasets[req.params.app].endpoint
        let query = datasets[req.params.app].nodeNames

        let result;
        try {
            result = await sparql.executeQuery(query, endpoint, true)
    
            if (!result.message) {
                result = result.map( d => ( { value: d.value.value } )) 

                let out = "[" + result.map(el => JSON.stringify(el, null, 4)).join(",") + "]";
                fs.writeFileSync(datafile, out) 
            }
        } catch(e) {
            result = { message: `An error occured: ${e.message}` }
        }

        res.send(JSON.stringify(result))
    } else {
        res.status(404).send(`404: App "${req.params.app}" not found.`)
    }
})

function hash() {  
    let string = Object.values(arguments).join('--')

    return crypto.createHash('sha256').update(string).digest('hex')
}

app.post(prefix + '/data/:app', async function(req, res) {
   
    let data = { value: req.body.value, type: req.body.type === 'undefined' ? undefined : req.body.type }

    let config = {}
    if (req.body.query) {
        config.query = req.body.query, 
        config.endpoint = req.body.endpoint
        config.queryhash = req.body.hashCode
    }

    let result;
    try {
        let transform = TransformFactory.getTransform(req.params.app, config)
        await transform.createFolder()
        result = await transform.getData(data)
        if (!result) result = { message: "An error occurred while retrieving the data. Please try again later." }
    } catch(error) {
        result = { message: `An error occurred: ${error.message}` }
    }
    
    res.send(JSON.stringify(result))
})

app.post(prefix + '/clearcache/:app', async function(req, res) {
    
    let folderpath = `data/${req.params.app}/${req.body.hashCode}`

    // Read the directory contents
    fs.readdir(folderpath, (err, files) => {
        if (err) {
          console.error(`Error reading the folder: ${err}`);
          return;
        }
    
        files.forEach(file => {
            
            const filePath = path.join(folderpath, file);
            fs.stat(filePath, (err, stat) => {
                if (err) {
                    console.error(`Error stating file: ${err}`);
                    res.sendStatus(500)
                    return;
                }
        
                if (stat.isFile()) {
                fs.unlink(filePath, err => {
                    if (err) {
                        console.error(`Error deleting file: ${err}`);
                        res.sendStatus(500)
                        return
                    } 
                })
                } 
            })
        })
      })

    res.sendStatus(200)
})

// About page 
app.get(prefix + '/about', function (req, res) {
    res.render("pages/about");
})

const port = 8020
const portHTTPS = 8023

app.listen(port, async () => { console.log(`HTTP Server started at port ${port}.`) })

try {
    let folderpath = '/etc/httpd/certificate/exp_20250808/'
    var privateKey = fs.readFileSync( folderpath + 'dataviz_i3s_unice_fr.key' );
    var certificate = fs.readFileSync( folderpath + 'dataviz_i3s_unice_fr_cert.crt' );
    var ca = fs.readFileSync( folderpath + 'dataviz_i3s_unice_fr_AC.cer' );
    var options = {key: privateKey, cert: certificate, ca: ca};
    https.createServer( options, function(req,res)
    {
        app.handle( req, res );
    } ).listen( portHTTPS, async () => { console.log(`HTTPS Server started at port ${portHTTPS}.`) } );
} catch(e) {
    console.log("Could not start HTTPS server")
}

