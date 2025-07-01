import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import fetch from 'node-fetch'

import { fileURLToPath } from 'url';


// Get __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// import { TransformFactory } from './datatools/transformFactory.js';
import { datasets } from './datatools/queries.js';

const app = express();

// CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// EJS views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let prefix = '/muvin';
app.use(prefix, express.static(path.join(__dirname, '../web-component/dist')))
app.use(prefix, express.static(path.join(__dirname, 'public')))

app.get('/muvin/prov-data/:filename', (req, res) => {
    let filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'data', filename));
});

// About page
app.get(prefix, (req, res) => {
    res.render('about');
});


// Main app entry
app.get(prefix + '/app/:app', (req, res) => {

    let query = datasets[req.params.app]?.items || req.query?.query
    let endpoint = datasets[req.params.app]?.endpoint || req.query?.endpoint
    
    res.render('index', 
        { app: req.params.app, 
          hashCode: hash(query, endpoint), 
          query: query, 
          endpoint: endpoint, 
          proxy: `/muvin/sparql/${req.params.app}`,
          value: req.query?.value,
          type: req.query?.type,
          token: req.query?.token
        });
});

// SPARQL request
app.get(prefix + '/sparql/:app', async function (req, res) {
    try {
        const endpoint = req.query.endpoint;
        const query = req.query.query;

        if (!endpoint || !query) {
            return res.status(400).json({ error: 'Missing endpoint or query parameter' });
        }

        let cacheFile = path.join(__dirname, `data/${req.params.app}/${hash(endpoint, query)}.json`)
        if (fs.existsSync(cacheFile)) {
            return res.sendFile(cacheFile)
        }

        const response = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' },
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `SPARQL endpoint returned status ${response.statusText}`
            });
        }

        const data = await response.json();

        fs.mkdirSync(`data/${req.params.app}`, { recursive: true });
        
        console.log("Writing cache file:", cacheFile);
        fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');

        res.json(data);
    } catch (error) {
        console.error('SPARQL proxy error:', error);
        res.status(500).json({ error: 'Proxy error', detail: error.message });
    }
})



// Nodes route
app.get(prefix + '/:app/data/nodes', async (req, res) => {
    const dir = path.join(__dirname, `data/${req.params.app}/`);
    const datafile = path.join(dir, 'nodes.json');

    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(datafile)) {
        res.sendFile(datafile);
    } else if (datasets[req.params.app]) {
        const nodes = await getNodesList(datasets[req.params.app].endpoint, datasets[req.params.app].nodeNames);
        fs.writeFileSync(datafile, JSON.stringify(nodes, null, 4))
        res.json(nodes);
    } else {
        res.status(404).send(`404: App "${req.params.app}" not found.`);
    }
})

async function getNodesList(endpoint, query) {
    const data = []
    let offset = 0;
    while (true) {
        let json;

        const pagedQuery = query.replace('$offset', offset);
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(pagedQuery)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' },
        });
    
        if (!response.ok) {
            return { message: `SPARQL endpoint returned status ${response.statusText} (${response.status})`}
        } 

        json = await response.json();

        const bindings = json?.results?.bindings || [];
        data.push(...bindings);
        
        if (bindings.length === 0 || bindings.length < 10000) break;
        
        offset += 10000;
    }

    return data.map( d => ( { value: d.value.value } )) 
}

// Clear cache route
app.post(prefix + '/clearcache/:app', async (req, res) => {
    const folderpath = path.join(__dirname, `data/${req.params.app}`);

    fs.readdir(folderpath, (err, files) => {
        if (err) {
            console.error(`Error reading folder: ${err}`);
            return res.sendStatus(500);
        }

        files.forEach(file => {
            if (file === 'nodes.json') return; // Skip this file

            const filePath = path.join(folderpath, file);

            fs.stat(filePath, (err, stat) => {
                if (err) {
                    console.error(`Error stating file: ${err}`);
                    return;
                }

                if (stat.isFile()) {
                    fs.unlink(filePath, err => {
                        if (err) console.error(`Error deleting file: ${err}`);
                    });
                }
            });
        });

        res.sendStatus(200);
    });
});

// About route
app.get(prefix + '/about', (req, res) => {
    res.render("pages/about");
});

// Hash function
function hash(...args) {
    return crypto.createHash('sha256').update(args.join('--')).digest('hex');
}

// Start HTTP
const port = 8020;
app.listen(port, () => {
    console.log(`✅ HTTP Server started on port ${port}`);
});

// Start HTTPS
try {
    const certPath = '/etc/httpd/certificate/exp_20250808/';
    const options = {
        key: fs.readFileSync(path.join(certPath, 'dataviz_i3s_unice_fr.key')),
        cert: fs.readFileSync(path.join(certPath, 'dataviz_i3s_unice_fr_cert.crt')),
        ca: fs.readFileSync(path.join(certPath, 'dataviz_i3s_unice_fr_AC.cer'))
    };

    https.createServer(options, app).listen(8023, () => {
        console.log(`✅ HTTPS Server started on port 8023`);
    });
} catch (e) {
    console.log("⚠️ Could not start HTTPS server:", e.message);
}
