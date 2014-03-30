# Prime Browse

I'd like to find movies to watch from Amazon Prime Instant Video, but I hate
the Amazon UI.  It's cluttered with videos that aren't Prime eligible, shows
only a few covers at a time without any useful metadata, and doesn't provide
useful ways to filter results.  I wrote some scripts to scrape the data from
Amazon's website, put it into an Elasticsearch server, and make it browse-able
with a simple web front end.

![screenshot](https://raw.githubusercontent.com/kielni/prime-browse/master/img/screenshot.png "Screenshot")

## Setup

Requirements:

  * a web server
  * Recline library (https://github.com/okfn/recline)
  * Elasticsearch backend (https://github.com/okfn/elasticsearch.js/)
  * Elasticsearch (http://www.elasticsearch.org/)
  * Python 2.7.x with BeautifulSoap, pyelasticsearch, and selenium modules

### Elasticsearch setup

  * create the `prime` index
  * run `setup.py` to create the `video` mapping 
  * run `prime_video.py` to scrape data from Amazon's site into Elasticsearch index; re-run weekly to get new data
  * run `add_metadata.py` to update video documents with metadata; repeat until no records have a missing metadata field
   

### webapp setup

  * copy `webapp` directory to web server
  * copy recline to `webapp_dir/lib/`
  * copy elasticsearch.js to `webapp_dir/lib/`
  * point browser to `webserver/index.html`

## TODO

  * scroll left nav with content
  * color queue button on click in Chrome
  * remove from queue filtered list on de-select
  * hide regular version if HD version available
  * add not found genre if no metadata
  * better metadata?
  * get data from recently added (7 days)
  * verify that videos are still available in Prime

   