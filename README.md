# Muvin

## To run the visualization on your machine
 - Clone the repertory
 - Open the folder on a terminal
 - Install the necessary packages with **npm install**
 - Run the server with **npm start**

 Open the application on the browser at http://localhost:8020/muvin/

## You can explore data from any SPARQL endpoint by including your queries in the queries.js file
 1. Prepare a query that returns data describing a list of items through at least the following variables
  - *?id:* a unique value identifying the item, typically the associated URI.
  - *?artist:* the person to whom the item belongs. It is represented as a node in the network.
  - *?name:* the label of the item, e.g. the title of a paper or the name of a song
  - *?date:* the release or publication date of the item
  - *?type:* the type of item, e.g. in scientific data, it can be the publication type (conference or journal articles)
  - *?contributors:* the list of collaborators of the item, e.g. the co-authors. It should be provided as a string where different names are separated by "--", for instance:
    - "collaborator1--collaborator2--collaborator3": this format provides a list of collaborators' names
    - "collaborator1&&type1--collaborator2&&type2--collaborator3&&type3": this format provides the collaboration type for each collaborators, e.g. in music, each person can have a different role, such as performer, producer or composer.
  - *?link:* (optional) a link to an external service, such as the data source

 2. Prepare a query that returns the names of every node available in your database, see example in queries.js under nodeNames. This will be used to support the user on choosing a starting point for the visualization and on finding new nodes to include in the network.

 3. Prepare a query that returns information describing the nodes, see examples in queries.js under nodeFeatures. This will be used to describe the nodes, e.g. for artists you cna provide information regarding their birth and death dates and groups of which they were members, while for authors these information can describe the institutions of which they were members during their career.

 4. Include your dataset in the application. Go to the muvin.js file, in the template definition (at the bottom of the page). Find the <\select> tag that defines the list of datasets available and include yours there. 

 5. Run the application. Muvin will automatically launch the nodeFeatures query when the dataset is selected, which also creates a folder based on the value of the <\option> tag used to identify your dataset. 

 ## Online demo

 The visualization is available online at http://dataviz.i3s.unice.fr/muvin/

 ## License

 See the [LICENSE file](LICENSE).





