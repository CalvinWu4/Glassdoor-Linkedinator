/*****************************************************
This script is activated on Linkedin search pages. It will attach
a hover event onto company names that appear in search results
*****************************************************/
/* Check if company is already in localstorage */
var checkDatabase = function(name) {
    if(localStorage[name]) {
		return true;
    }
    return false;
}
/* Save ratings into local storage, and keep track of how old it is */
var save = function(name, rating) {
	localStorage[name] = rating * 10.0;
	var date = new Date();
	localStorage["gd-retrieval-date"] = date.toDateString();
}

/* Load rating */
var load = function(name) {
    return localStorage[name];
}

/* IP Generator - Fix IP address blocking issues */
var genIP = function() {
	return randomInt() + "." + randomInt() + "." + randomInt() + "." + randomInt();
}

var randomInt = function () {
	return Math.floor((Math.random() * 220) + 15);
}

/* Grab the GlassDoor Data given the company name */
var gdinfo = function (element, name) {
    var currentDate = new Date();
    var storageData = load(name);
    var storageTime = new Date(localStorage["gd-retrieval-date"]);
    /* Used for calculating how old the data in local storage is */
    var oneDay = 24*60*60*1000;

    if(checkDatabase(name) && 
    	Math.round(Math.abs((currentDate.getTime() - storageTime.getTime())/(oneDay))) < 7) {
			/* Database entry hit - Use recent data from in localstorage. Divide by 10
				for float storage workaround  */
			var rating = storageData/10.0;
			element.parent().find(".glassdoor-rating").html(rating);
    } else {
    	/* Database entry miss - Send new HTTP Request to Glassdoor API for rating info */
		var xmlhttp = new XMLHttpRequest();
		const partnerid = 51706;
		const apikey = "xBpFKWDKEM";
		var proxyurl = "https://cors-anywhere.herokuapp.com/";
		var url = "https://api.glassdoor.com/api/api.htm?v=1&format=json&t.p=" + partnerid + "&t.k=" + apikey + "&action=employers&userip=" + genIP() + "&useragent=" + navigator.userAgent + "&q=" + name;
		xmlhttp.open("GET", proxyurl + url, true);

		
		xmlhttp.onreadystatechange = function() {
		    if (xmlhttp.status == 200) {
				/* GET Successful, parse data into JSON object */
				var response = JSON.parse(xmlhttp.responseText || "null");
				if (response != null) {
				    if (response["success"] == true) {
						var rating = response["response"].employers[0].overallRating;
						save(name,rating);
						element.parent().find(".glassdoor-rating").html(rating);
				    }
				    if (response["success"] == false) {
				    	/* GET Successful, but access denied error */
					var message = "Requests throttled by Glassdoor. Try again in a few minutes";
					element.parent().find(".glassdoor-rating").html(message);
				    }
				}
				else{
					element.parent().find(".glassdoor-rating").html("N/A");
				}
		    } else {
				/* GET Unsuccessful */
				var message = "Could not contact Glassdoor servers"
				element.parent().find("glassdoor-rating").html(message);
		    }
		};
		xmlhttp.send();
    }
}

/* Append a rating box to the end of each description element */
function appendWrapper(node){
	node.parent().append("<div class='glassdoor-label-wrapper'><div class='glassdoor-label'><div class='tbl'><div class='cell middle padRtSm'>Rating: <span class='glassdoor-rating'></div><div class='cell middle padRtSm'>powered by</div><div class='cell middle'><a href='https://www.glassdoor.com/index.htm'><img src='https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png' title='Job Search'></a></div></div><div></div></div></div>");
}

function appendRating(node){
	/* Each description class element will have the company name */
	var name = node.contents()
					.filter(function() { 
						return !!$.trim( this.innerHTML || this.data ); 
					})
					.first()
					.text();

	/* To avoid misdirected name searches */	
	const replaceManyStr = (obj, sentence) => obj.reduce((f, s) => `${f}`.replace(Object.keys(s)[0], s[Object.keys(s)[0]]), sentence)
	name = replaceManyStr(misdirectArray, name);

	if(typeof(name) !== "undefined") { 
		/* If we're in this loop, this was a valid company name. 
		Grab the company name and strip it of HTML tags */
		var cleanname = name.replace("<b>","").replace("</b>","");
		gdinfo(node, cleanname);
	}
}

$("[data-control-name='job_card_company_link']").each(function() {
	appendWrapper($(this));
	appendRating($(this));
});

$(document).arrive("[data-control-name='job_card_company_link']", function(){
	appendWrapper($(this));
	appendRating($(this));
});

// /* Each description class element will have the company name */
// $("[data-control-name='job_card_company_link']").each(function() {
// 	appendRating($(this));
// });

/* Force DOM to refresh when new page is clicked */
$(".pagination a").click(function() {
	window.location.reload();
});

/* Force DOM to refresh when new search is started */
$(".submit-advs").click(function() {
	window.location.reload();
});

/* Force DOM to refresh when new search criteria is added */
$(".label-container").click(function() {
	window.location.reload();
});

console.log('Glassdoor-Linkedinator loaded');