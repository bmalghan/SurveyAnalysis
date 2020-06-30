// required packages
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var fs = require('fs');

//features
var features = { "ng": "News Gallery", "ls": "Live Score", "sm": "Social Media", "lv": "Latest Videos", "o": "Other" }

//recommendation
var recommend = { "vu": "Very Unlikely", "u": "Unlikely", "n": "Neutral", "l": "Likely", "hl": "Highly Likely" }

// read the data file
function readData(fileName) {
    let dataRead = fs.readFileSync('./data/' + fileName + '.json');
    let infoRead = JSON.parse(dataRead);
    return infoRead;
}

// read the data file
function writeData(info, fileName) {
    console.log('w' + info);
    delete info[""];
    data = JSON.stringify(info);
    fs.writeFileSync('./data/' + fileName + '.json', data);
}

// update the data file, I use "name" to be equal to fruit, or animal or color
// to match with the file names
// I assume we always just add 1 to a single item
function combineCounts(name, value) {
    // console.log(value);
    info = readData(name);
    // will be useful for text entry, since the item typed in might not be in the list
    var found = 0;
    for (var i = 0; i < info.length; i++) {
        if (info[i][name] === value) {
            info[i].count = parseInt(info[i].count) + 1;
            found = 1;
        }
    }
    if (found === 0) {
        info.push({ [name]: value, count: 1 });
    }
    writeData(info, name);
}

function getFeatures(arr) {
    var feat = [];
    if (arr.length > 1) {
        for (i = 0; i < arr.length; i++) {
            feat[i] = features[arr[i]];
        }
    }
    else{
        feat[0] = features[arr[0]]
    }

    return feat;
}

function buildMainDB(json) {
    var featuresGen = getFeatures(json["feature"]);
    var survey = {
        "name": json["name"][0].concat(" ".concat(json["name"][0])),
        "gender": json["gender"],
        "features": featuresGen,
        "rate": json["rate"],
        "recommend": recommend[json["recommend"]],
        "comment": json["comment"]
    }

    let dataRead = fs.readFileSync('./data/mainDB.json');
    let infoRead = JSON.parse(dataRead);

    var num = Object.keys(infoRead).length + 1;
    infoRead[num] = survey;

    data = JSON.stringify(infoRead);
    fs.writeFileSync('./data/mainDB.json', data);
}

// This is the controler per se, with the get/post
module.exports = function (app) {

    // when a user goes to localhost:3000/analysis
    // serve a template (ejs file) which will include the data from the data files
    app.get('/analysis', function (req, res) {
        var gender = readData("gender");
        var rating = readData("rate");
        var feature = readData("feature");
        var recommend = readData("recommend");
        res.render('showResults', { results: [gender, rating, feature, recommend] });
        console.log([gender, rating, feature, recommend]);
    });

    // when a user goes to localhost:3000/niceSurvey
    // serve a static html (the survey itself to fill in)
    app.get('/niceSurvey', function (req, res) {
        res.sendFile(__dirname + '/views/niceSurvey.html');
    });

    // when a user types SUBMIT in localhost:3000/niceSurvey 
    // the action.js code will POST, and what is sent in the POST
    // will be recuperated here, parsed and used to update the data files
    app.post('/niceSurvey', urlencodedParser, function (req, res) {

        var json = req.body;
        buildMainDB(json);

        for (var key in json) {
            console.log(key + ": " + json[key]);
            // in the case of checkboxes, the user might check more than one
            if ((key === "feature") && (json[key].length !== 1)) {
                for (var item in json[key]) {
                    combineCounts(key, features[json[key][item]]);
                }
            }
            else if(key === "recommend"){
                combineCounts(key, recommend[json[key]]);
            }
            else if (key === "feature"){
                combineCounts(key, feature[json[key]]);
            }
            else if (key === "gender"  || key === "rate") {
                combineCounts(key, json[key]);
            }
        }
        // mystery line... (if I take it out, the SUBMIT button does change)
        // if anyone can figure this out, let me know!
        res.sendFile(__dirname + "/views/niceSurvey.html");
    });


};