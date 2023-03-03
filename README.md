# Sonification

## To explore the data using the visualization
 - Clone the repertory
 - Open the folder in Visual Studio Code
 - Open a terminal
 - Install the necessary packages with **npm install**
 - Run the server with **npm start**

Open the application on the browser at http://localhost:8080/

## For retrieving data from Wasabi SPARQL
  - Use the scripts inside data_scripts
  - Run fetchDataFromWasabi.py to retrieve the data (predefined SPARQL query hard coded)
  - Run transformData.py to reshape the data into what is expected by the visualization (a collaborative network -- items and links)

**Observation:** If the data changes, the visualization server must be restarted (if running at the time of modifications).
