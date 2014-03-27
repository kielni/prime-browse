from bs4 import BeautifulSoup
import requests
import codecs
import sys
import json
from pyelasticsearch import ElasticSearch
import time
import re

sys.stdout = codecs.getwriter("utf-8")(sys.__stdout__)

# + t=title y=year
url = "http://www.omdbapi.com/"

es = ElasticSearch("http://localhost:9200/")
# get records with missing metadata
query = {
    "size" : 1000,
    "query" : {
        "constant_score": {
            "filter": {
                "missing": {
                    "field": "metadata"
                }
            }
        }
    }
}
results = es.search(query, index="prime")
for r in results["hits"]["hits"]:
    time.sleep(0.5)
    # get metadata
    doc = r["_source"]
    title = doc["title"]
    title = re.sub("\s+\[.+?\]", "", title)
    params = { "t" : title }
    # remove [HD] from title
    year = None
    if "year" in doc:
        year = doc["year"]
        params["y"] = year
    mid = r["_id"]
    rq = requests.get(url, params=params)
    print "url=%s text=%s" % (rq.url, rq.text)
    try:
        jq = json.loads(rq.text)
    except:
        jq = { "Response" : "False" }
    json.dumps(jq, indent=2)
    metadata = { }
    if jq["Response"] == "False":
        metadata["metadata"] = "missing"
    else:
        # remove Response, Year
        jq.pop("Response", None)
        jq.pop("Year", None)
        jq.pop("Title", None)
        # split Genre on commas
        if "Genre" in jq:
            jq["Genre"] = jq["Genre"].split(", ")
        # remove min from Runtime and make into an int
        if "Runtime" in jq:
            runtime = re.sub(" min", "", jq["Runtime"])
            try:
                jq["Runtime"] = int(runtime)
            except ValueError:
                jq.pop("Runtime", None)
        # remove comma from imbdbVotes and make into an int
        if "imdbVotes" in jq:
            votes = re.sub(",", "", jq["imdbVotes"])
            try:
                jq["imdbVotes"] = int(votes)
            except ValueError:
                jq.pop("imdbVotes", None)
        # parse Metascore to float
        if "Metascore" in jq:
            try:
                jq["Metascore"] = float(jq["Metascore"])
            except ValueError:
                jq.pop("Metascore", None)
        # parse imdbRating to float
        if "imdbRating" in jq:
            try:
                jq["imdbRating"] = float(jq["imdbRating"])
            except ValueError:
                jq.pop("imdbRating", None)
        metadata = {
            "metadata" : "true"
        }
        for key, value in jq.iteritems():
            #print "key=%s value=%s" % (key, value)
            metadata[key] = jq[key]
    # update
    #print "update=%s" % metadata
    print es.update("prime", "video", mid, doc=metadata)
