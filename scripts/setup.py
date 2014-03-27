from pyelasticsearch import ElasticSearch

es = ElasticSearch("http://localhost:9200/")
mapping = {
    "video" : {
        "properties" : {
            "title" : { "type" : "string" },
            "year" : { "type" : "integer" },
            "image_url" : { "type" : "string", "index" : "not_analyzed" },
            "amazon_url"  : { "type" : "string", "index" : "not_analyzed" },
            "Genre" : { "type" : "string", "index" : "not_analyzed" },
            "Metascore" : { "type" : "float", "null_value" : 0.0 },
            "imdbRating" : { "type" : "float", "null_value" : 0.0 },
            "Runtime" : { "type" : "integer" },
            "Type" : { "type" : "string", "index" : "not_analyzed" },
            "Rated" : { "type" : "string", "index" : "not_analyzed" },
            "imdbID" : { "type" : "string", "index" : "not_analyzed" },
            "metadata" : { "type" : "string", "index" : "not_analyzed" },
            "queue" : { "type" : "string", "index" : "not_analyzed" }
        }
    }
}
print es.put_mapping("prime", "video", mapping)

